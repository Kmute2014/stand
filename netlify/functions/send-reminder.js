exports.handler = async (event) => {
    // 1. CONFIGURATION - DOUBLE CHECK THESE
    const FIREBASE_PROJECT_ID = 'gen-lang-client-0352188065';
    const COLLECTION_NAME = 'users'; // Change to 'Users' if your folder is capitalized
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');
        console.log(`Searching for IDs: ${userIds} in Project: ${FIREBASE_PROJECT_ID}`);

        let usersToRemind = [];

        if (userIds && Array.isArray(userIds)) {
            for (const id of userIds) {
                // Constructing the URL
                const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${id}`;

                console.log(`Requesting URL: ${docUrl}`);

                const response = await fetch(docUrl);

                // If the response is not OK (404, 403, etc)
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`FIREBASE ERROR: Received status ${response.status}`);
                    console.error(`ERROR DETAIL: ${errorText.substring(0, 200)}`);
                    continue; // Skip to next ID
                }

                const data = await response.json();

                if (data.fields) {
                    const email = data.fields.email?.stringValue;
                    const status = data.fields.status?.stringValue;
                    const name = data.fields.name?.stringValue || 'Team Member';

                    console.log(`Found: ${email} | Status: ${status}`);

                    if (email && status === "Active") {
                        usersToRemind.push({ email, name });
                    }
                }
            }
        }

        if (usersToRemind.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: "No active users found. Check logs for 'FIREBASE ERROR'."
                })
            };
        }

        // Send Emails via Brevo
        let emailsSent = 0;
        for (const user of usersToRemind) {
            const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: 'StandUpPhelo', email: SENDER_EMAIL },
                    to: [{ email: user.email, name: user.name }],
                    subject: '⏰ Daily Standup Reminder - StandUpPhelo',
                    textContent: `Hi ${user.name.split(' ')[0]}, It's time for your daily standup!`
                })
            });
            if (brevoRes.ok) emailsSent++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `Sent ${emailsSent} reminders` })
        };

    } catch (error) {
        console.error('CRASH:', error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};