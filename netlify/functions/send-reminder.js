exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0352188065';

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Email service not configured' })
            };
        }

        // Querying Firestore
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users`;
        const query = `?pageSize=100`;

        let usersToRemind = [];

        try {
            const firestoreResponse = await fetch(firestoreUrl + query);
            const firestoreData = await firestoreResponse.json();

            if (firestoreData.documents) {
                usersToRemind = firestoreData.documents
                    .filter(doc => {
                        const fields = doc.fields || {};

                        // Extract values safely
                        const email = fields.email?.stringValue;
                        const status = fields.status?.stringValue;

                        // Debug log to see exactly what is coming from Firebase
                        console.log(`Checking User: ${email} | Status found: "${status}"`);

                        // Logic: Status must exist and match "Active" (ignoring surrounding spaces)
                        const isActive = status && status.trim() === "Active";

                        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
                            const docId = doc.name.split('/').pop();
                            return userIds.includes(docId) && email && isActive;
                        }

                        return email && isActive;
                    })
                    .map(doc => ({
                        id: doc.name.split('/').pop(),
                        email: doc.fields.email.stringValue,
                        name: doc.fields.name?.stringValue || 'Team Member'
                    }));
            }
        } catch (err) {
            console.error('Firestore Fetch Error:', err.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch users', details: err.message })
            };
        }

        if (usersToRemind.length === 0) {
            console.log('Filter result: 0 active users found.');
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'No active users found' })
            };
        }

        let emailsSent = 0;
        const errors = [];

        for (const user of usersToRemind) {
            try {
                const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': apiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: 'StandUpPhelo', email: senderEmail },
                        to: [{ email: user.email, name: user.name }],
                        subject: '⏰ Daily Standup Reminder - StandUpPhelo',
                        textContent: `Hi ${user.name.split(' ')[0]},\n\nIt's time to submit your daily standup at StandUpPhelo!\n\nLink: https://standupphelo.netlify.app/`
                    })
                });

                if (response.ok) emailsSent++;
                else errors.push({ email: user.email, status: response.status });
            } catch (err) {
                errors.push({ email: user.email, error: err.message });
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Reminders sent to ${emailsSent} active user(s)`,
                errors: errors.length > 0 ? errors : undefined
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Function error', details: error.message })
        };
    }
};