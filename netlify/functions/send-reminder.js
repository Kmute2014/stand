exports.handler = async (event) => {
    // --- 1. CONFIGURATION ---
    const FIREBASE_PROJECT_ID = 'gen-lang-client-0352188065';
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');
        console.log(`Targeting project: ${FIREBASE_PROJECT_ID}`);

        let usersToRemind = [];

        if (userIds && Array.isArray(userIds)) {
            for (const id of userIds) {
                // Direct URL to the user document
                const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${id}`;

                console.log(`Fetching: ${docUrl}`);

                const response = await fetch(docUrl);
                const responseText = await response.text(); // Get as text first to avoid JSON crash

                try {
                    const data = JSON.parse(responseText);

                    if (response.ok && data.fields) {
                        const email = data.fields.email?.stringValue;
                        const status = data.fields.status?.stringValue;
                        const name = data.fields.name?.stringValue || 'Team Member';

                        console.log(`Found User: ${email} | Status: ${status}`);

                        if (email && status === "Active") {
                            usersToRemind.push({ email, name });
                        }
                    } else {
                        console.error(`Firebase returned an error for ${id}:`, data.error?.message || 'Unknown error');
                    }
                } catch (jsonErr) {
                    // If we are here, Firebase returned HTML (an error page) instead of JSON
                    console.error(`CRITICAL: Firebase did not return JSON. It returned HTML. This usually means the Project ID or the Database path is wrong.`);
                    console.log(`Raw Response snippet: ${responseText.substring(0, 100)}`);
                }
            }
        }

        if (usersToRemind.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'No active users found. Check logs for HTML error.' })
            };
        }

        // --- 2. SEND EMAILS ---
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
        console.error('Function Crash:', error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};