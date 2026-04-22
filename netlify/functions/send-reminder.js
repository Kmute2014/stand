exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0352188065';

        console.log('Request received for userIds:', userIds);

        let usersToRemind = [];

        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            for (const id of userIds) {
                // Construct direct URL to the user document
                const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/documents/users/${id}`;

                try {
                    const response = await fetch(docUrl);
                    const data = await response.json();

                    if (response.ok && data.fields) {
                        const email = data.fields.email?.stringValue;
                        const status = data.fields.status?.stringValue;
                        const name = data.fields.name?.stringValue || 'Team Member';

                        console.log(`Checking DB for ${id}: Email=${email}, Status=${status}`);

                        // STRICT CHECK: Must have email and status must be "Active"
                        if (email && status === "Active") {
                            usersToRemind.push({ email, name });
                        } else {
                            console.log(`User ${id} skipped. Status is: ${status}`);
                        }
                    } else {
                        console.error(`User ${id} not found or has no fields.`, data.error || '');
                    }
                } catch (fetchErr) {
                    console.error(`Error fetching user ${id}:`, fetchErr.message);
                }
            }
        }

        // If after checking all IDs we have nobody in the list
        if (usersToRemind.length === 0) {
            console.log('Final Result: No active users matched.');
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'No active users found' })
            };
        }

        // Send Emails via Brevo
        let emailsSent = 0;
        for (const user of usersToRemind) {
            const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
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
            if (brevoRes.ok) emailsSent++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Reminders sent to ${emailsSent} active user(s)`
            })
        };

    } catch (error) {
        console.error('Function Global Error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};