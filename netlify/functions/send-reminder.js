exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');

        // --- CONFIGURATION ---
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        // Updated fallback to your verified Project ID
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'stand-22db8';

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Email service key missing' }) };
        }

        // Firestore REST API URL
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users?pageSize=100`;

        let usersToRemind = [];

        try {
            const firestoreResponse = await fetch(firestoreUrl);
            const firestoreData = await firestoreResponse.json();

            if (firestoreResponse.ok && firestoreData.documents) {
                usersToRemind = firestoreData.documents
                    .filter(doc => {
                        const fields = doc.fields;
                        const email = fields?.email?.stringValue;
                        const status = fields?.status?.stringValue;

                        // Only proceed if user has an email and status is exactly 'Active'
                        const isActive = (status === 'Active');
                        if (!email || !isActive) return false;

                        // If the request specifically targeted certain IDs, filter for them
                        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
                            const docId = doc.name.split('/').pop();
                            return userIds.includes(docId);
                        }

                        return true;
                    })
                    .map(doc => ({
                        email: doc.fields.email.stringValue,
                        name: doc.fields.name?.stringValue || 'Team Member'
                    }));
            } else {
                console.error('Firestore Fetch Error:', firestoreData.error?.message || 'No documents');
            }
        } catch (err) {
            console.error('Database Connection Error:', err.message);
        }

        if (usersToRemind.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'No active users found' })
            };
        }

        // Email Sending Logic
        let emailsSent = 0;
        for (const user of usersToRemind) {
            try {
                const emailBody = `Hi ${user.name.split(' ')[0]},\n\nIt's time to submit your daily standup at StandUpPhelo!\n\nLink: https://standupphelo.netlify.app/`;

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
                        textContent: emailBody
                    })
                });

                if (response.ok) emailsSent++;
            } catch (err) {
                console.error(`Failed to send to ${user.email}:`, err.message);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Reminders sent to ${emailsSent} user(s)`
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Function failed', details: error.message })
        };
    }
};