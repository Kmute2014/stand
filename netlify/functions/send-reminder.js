exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { userIds } = JSON.parse(event.body || '{}');
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0352188065';

        let usersToRemind = [];

        // 1. IF WE HAVE SPECIFIC USER IDs, FETCH THEM DIRECTLY
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            console.log(`Targeting specific users: ${userIds.join(', ')}`);

            for (const id of userIds) {
                const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users/${id}`;
                const response = await fetch(docUrl);

                if (response.ok) {
                    const doc = await response.json();
                    const fields = doc.fields || {};
                    const email = fields.email?.stringValue;
                    const status = fields.status?.stringValue;
                    const name = fields.name?.stringValue || 'Team Member';

                    console.log(`User ID: ${id} | Email: ${email} | Status: ${status}`);

                    // Only add if they are Active
                    if (email && status === "Active") {
                        usersToRemind.push({ id, email, name });
                    }
                } else {
                    console.log(`User ${id} not found in database.`);
                }
            }
        }
        // 2. IF NO USER IDs, FETCH THE WHOLE LIST (BACKUP)
        else {
            console.log('No userIds provided. Fetching all active users...');
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users?pageSize=300`;
            const response = await fetch(firestoreUrl);
            const data = await response.json();

            if (data.documents) {
                usersToRemind = data.documents
                    .filter(doc => {
                        const s = doc.fields?.status?.stringValue;
                        const e = doc.fields?.email?.stringValue;
                        return e && s === "Active";
                    })
                    .map(doc => ({
                        id: doc.name.split('/').pop(),
                        email: doc.fields.email.stringValue,
                        name: doc.fields.name?.stringValue || 'Team Member'
                    }));
            }
        }

        if (usersToRemind.length === 0) {
            console.log('Result: No active users found to remind.');
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'No active users found' })
            };
        }

        // 3. SEND THE EMAILS
        let emailsSent = 0;
        for (const user of usersToRemind) {
            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
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
                    textContent: `Hi ${user.name.split(' ')[0]},\n\nIt's time for your daily standup!`
                })
            });
            if (res.ok) emailsSent++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `Sent ${emailsSent} reminders` })
        };

    } catch (error) {
        console.error('Global Error:', error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};