exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { userName, blockers, userId } = JSON.parse(event.body);

        // --- CONFIGURATION ---
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        // USE YOUR NEW PROJECT ID HERE
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'stand-22db8';

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
        }

        console.log(`Blocker reported by ${userName}. Querying admins in ${firebaseProjectId}...`);

        // Correct REST API URL for the 'users' collection
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users`;

        let admins = [];

        try {
            const firestoreResponse = await fetch(firestoreUrl + "?pageSize=100");
            const firestoreData = await firestoreResponse.json();

            if (firestoreResponse.ok && firestoreData.documents) {
                admins = firestoreData.documents
                    .filter(doc => {
                        const fields = doc.fields;
                        // Checking for role === 'Admin'
                        return fields && fields.role && fields.role.stringValue === 'Admin';
                    })
                    .map(doc => ({
                        email: doc.fields.email?.stringValue || '',
                        name: doc.fields.name?.stringValue || 'Admin'
                    }))
                    .filter(admin => admin.email !== ''); // Remove any without emails
            } else {
                console.error('Firestore Query failed or no documents found:', firestoreData.error || 'Empty');
            }
        } catch (err) {
            console.error('Error fetching admins:', err.message);
        }

        // Fallback if no admins are found in the DB
        if (admins.length === 0) {
            console.log('Using default admin fallback email');
            const defaultAdmin = process.env.ADMIN_EMAIL || 'dsarkodie@datrixtechsolutions.com';
            admins = [{ email: defaultAdmin, name: 'Admin' }];
        }

        let emailsSent = 0;
        for (const admin of admins) {
            const result = await sendBlockerEmail(admin.email, userName, blockers, senderEmail, apiKey);
            if (result.success) emailsSent++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Blocker alert sent to ${emailsSent} admin(s)`
            })
        };
    } catch (error) {
        console.error('Global Error:', error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

async function sendBlockerEmail(adminEmail, userName, blockers, senderEmail, apiKey) {
    const payload = {
        sender: { name: 'StandUpPhelo', email: senderEmail },
        to: [{ email: adminEmail }],
        subject: `🛑 BLOCKER ALERT: ${userName} is stuck`,
        textContent: `User: ${userName}\nBlocker: ${blockers}\n\nPlease help resolve this blocker as soon as possible.`
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

        return { success: response.ok };
    } catch (error) {
        return { success: false, error: error.message };
    }
}