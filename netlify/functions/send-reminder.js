exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');

        console.log('Reminder request:', { userIds });

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

        // Query Firestore for users with 'Active' status
        console.log('Querying Firestore for active users...');

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
                        const email = fields.email?.stringValue;
                        const status = fields.status?.stringValue;

                        // Only include users where status is exactly 'Active'
                        const isActive = (status === 'Active');

                        // If specific userIds provided, filter by those who are also Active
                        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
                            const docId = doc.name.split('/').pop();
                            return userIds.includes(docId) && email && isActive;
                        }

                        // Send to all users with an email who have 'Active' status
                        return email && isActive;
                    })
                    .map(doc => ({
                        id: doc.name.split('/').pop(),
                        email: doc.fields.email.stringValue,
                        name: doc.fields.name?.stringValue || 'Team Member'
                    }));
            }
        } catch (err) {
            console.error('Error querying Firestore:', err.message);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Failed to fetch users',
                    details: err.message
                })
            };
        }

        if (usersToRemind.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'No active users to remind'
                })
            };
        }

        console.log(`Found ${usersToRemind.length} active user(s) to remind:`, usersToRemind.map(u => u.email));

        let emailsSent = 0;
        const errors = [];

        // Send reminder to each active user
        for (const user of usersToRemind) {
            if (!user.email) continue;

            try {
                const emailBody = `Hi ${user.name.split(' ')[0]},

It's time to submit your daily standup at StandUpPhelo!

Please log in and share what you accomplished yesterday, what you're working on today, and any blockers you're facing.

Link: https://standupphelo.netlify.app/

Best regards,
StandUpPhelo Team`;

                const payload = {
                    sender: {
                        name: 'StandUpPhelo',
                        email: senderEmail
                    },
                    to: [{
                        email: user.email,
                        name: user.name
                    }],
                    subject: '⏰ Daily Standup Reminder - StandUpPhelo',
                    textContent: emailBody
                };

                console.log('Sending reminder to:', user.email);

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
                console.log('Brevo response status:', response.status);

                if (!response.ok) {
                    console.error('Brevo API error for', user.email, ':', responseText);
                    errors.push({ email: user.email, error: responseText });
                } else {
                    emailsSent++;
                    console.log(`Reminder sent to ${user.email}`);
                }
            } catch (err) {
                console.error(`Failed to send reminder to ${user.email}:`, err.message);
                errors.push({ email: user.email, error: err.message });
            }
        }

        console.log(`Reminders sent to ${emailsSent} active user(s)`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Reminders sent to ${emailsSent} active user(s)`,
                errors: errors.length > 0 ? errors : undefined
            })
        };

    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Function error',
                details: error.message
            })
        };
    }
};