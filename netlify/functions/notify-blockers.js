exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { userName, blockers, userId } = JSON.parse(event.body);

        console.log('Blocker notification request:', { userName, blockers });

        if (!userName || !blockers) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: userName, blockers' })
            };
        }

        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0352188065';

        if (!apiKey) {
            console.error('BREVO_API_KEY environment variable not set');
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Email service not configured',
                    details: 'BREVO_API_KEY not set'
                })
            };
        }

        // Query Firestore for all admins using REST API
        console.log('Querying Firestore for admins...');

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users`;

        const query = `?pageSize=100`;

        let admins = [];

        try {
            const firestoreResponse = await fetch(firestoreUrl + query);
            const firestoreData = await firestoreResponse.json();

            if (firestoreData.documents) {
                admins = firestoreData.documents
                    .filter(doc => {
                        const fields = doc.fields;
                        return fields && fields.role && fields.role.stringValue === 'Admin';
                    })
                    .map(doc => ({
                        id: doc.name.split('/').pop(),
                        email: doc.fields.email?.stringValue || '',
                        name: doc.fields.name?.stringValue || 'Admin'
                    }));
            }
        } catch (err) {
            console.error('Error querying Firestore:', err.message);
            // Fall back to default admin email
            admins = [];
        }

        // If no admins found, use default admin email
        if (admins.length === 0) {
            console.log('No admins found via Firestore, using default admin email');
            const defaultAdmin = process.env.ADMIN_EMAIL || 'dsarkodie@datrixtechsolutions.com';
            admins = [{ email: defaultAdmin, name: 'Admin' }];
        }

        console.log(`Found ${admins.length} admin(s):`, admins.map(a => a.email));

        let emailsSent = 0;
        const errors = [];

        // Send email to each admin
        for (const admin of admins) {
            if (!admin.email) continue;

            try {
                const result = await sendBlockerEmail(admin.email, userName, blockers, senderEmail, apiKey);
                if (result.success) {
                    emailsSent++;
                    console.log(`Email sent to ${admin.email}`);
                } else {
                    errors.push({ email: admin.email, error: result.error });
                }
            } catch (err) {
                console.error(`Failed to send email to ${admin.email}:`, err.message);
                errors.push({ email: admin.email, error: err.message });
            }
        }

        console.log(`Blocker notification sent to ${emailsSent} admin(s)`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Blocker alert sent to ${emailsSent} admin(s)`,
                adminsNotified: admins.length,
            })
        };
    }
};

async function sendBlockerEmail(adminEmail, userName, blockers, senderEmail, apiKey) {
    const emailBody = `🛑 BLOCKER ALERT

User: ${userName}
Blocker: ${blockers}

Please review and help resolve this blocker as soon as possible.

StandUpPhelo Team`;

    const payload = {
        sender: {
            name: 'StandUpPhelo',
            email: senderEmail
        },
        to: [{
            email: adminEmail
        }],
        subject: '🛑 BLOCKER ALERT: New blocker reported',
        textContent: emailBody
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`Brevo API error for ${adminEmail}:`, responseText);
            return {
                success: false,
                error: responseText
            };
        }

        console.log(`Blocker alert sent to ${adminEmail}`);
        return { success: true };

    } catch (error) {
        console.error('Fetch error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}
