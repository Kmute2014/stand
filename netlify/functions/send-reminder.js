const { schedule } = require('@netlify/functions');

// Set to run every 15 minutes. 
// The logic below will ensure it only sends at the EXACT hour/minute saved in Firestore.
exports.handler = async (event) => {
    // Detect if trigger is automated (Cron) or manual (Button Click)
    const isCronTrigger = event.kind === 'schedule';

    try {
        const { userIds } = JSON.parse(event.body || '{}');

        // --- 1. SETTINGS & AUTH ---
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || 'datrixhost@gmail.com';
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'stand-22db8';

        if (!apiKey) return { statusCode: 500, body: 'Email service key missing' };

        // --- 2. FETCH SCHEDULE FROM FIRESTORE ---
        const settingsUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/settings/schedule`;
        const settingsResp = await fetch(settingsUrl);
        const settingsData = await settingsResp.json();

        // Parse Firestore REST format
        const activeDays = settingsData.fields?.activeDays?.arrayValue?.values?.map(v => v.stringValue) || [];
        const scheduledTime = settingsData.fields?.time?.stringValue; // e.g. "08:30"
        const timezone = settingsData.fields?.timezone?.stringValue || 'Africa/Accra';
        const autoEnabled = settingsData.fields?.autoEnabled?.booleanValue || false;

        // --- 3. THE AUTOMATION GATEKEEPER ---
        if (isCronTrigger) {
            // Use the specific timezone saved in your SchedulePage
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: timezone.split(' ')[0], // Extract "Africa/Accra" from the string
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            const parts = formatter.formatToParts(now);
            const currentDay = parts.find(p => p.type === 'weekday').value;
            const currentHour = parts.find(p => p.type === 'hour').value;
            const currentMinute = parts.find(p => p.type === 'minute').value;
            const currentTimeStr = `${currentHour}:${currentMinute}`;

            const isCorrectDay = activeDays.includes(currentDay);

            // Allow a 15-minute window for the Cron to catch the time
            const [sHour, sMin] = scheduledTime.split(':');
            const isCorrectTime = (currentHour === sHour && Math.abs(parseInt(currentMinute) - parseInt(sMin)) < 15);

            if (!autoEnabled || !isCorrectDay || !isCorrectTime) {
                return {
                    statusCode: 200,
                    body: `Skipped: Auto=${autoEnabled}, Day=${isCorrectDay}, TimeMatch=${isCorrectTime}`
                };
            }
        }

        // --- 4. FETCH ACTIVE USERS ---
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users?pageSize=100`;
        const firestoreResponse = await fetch(firestoreUrl);
        const firestoreData = await firestoreResponse.json();

        if (!firestoreResponse.ok || !firestoreData.documents) {
            return { statusCode: 500, body: 'Failed to fetch users' };
        }

        // Generate today's date string to match your Firestore 'lastStandup' format
        // Example format: "23 Apr"
        const todayMarker = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const usersToRemind = firestoreData.documents
            .filter(doc => {
                const f = doc.fields;
                const email = f?.email?.stringValue;
                const status = f?.status?.stringValue;
                const lastStandup = f?.lastStandup?.stringValue || "";

                // Logic: Must be active, have an email, and NOT have already submitted today
                const isActive = (status === 'Active');
                const hasNotSubmittedToday = !lastStandup.includes(todayMarker);

                if (!email || !isActive || !hasNotSubmittedToday) return false;

                // If manual button was clicked for specific users
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

        if (usersToRemind.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: 'Everyone is up to date!' }) };
        }

        // --- 5. SEND EMAILS VIA BREVO ---
        let emailsSent = 0;
        for (const user of usersToRemind) {
            try {
                const response = await fetch('https://api.api-key.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': apiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: 'StandUpPhelo', email: senderEmail },
                        to: [{ email: user.email, name: user.name }],
                        subject: '⏰ Time for Standup!',
                        textContent: `Hi ${user.name.split(' ')[0]},\n\nYou haven't submitted your standup for today yet. Take a minute to update the team!\n\nSubmit here: https://standupphelo.netlify.app/`
                    })
                });
                if (response.ok) emailsSent++;
            } catch (err) {
                console.error(`Brevo error for ${user.email}:`, err.message);
            }
        }

        // --- 6. OPTIONAL: LOG TO FIRESTORE ---
        // You could add a call here to write to a 'notifications' collection 
        // so the UI "Notification Log" updates automatically.

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, sentCount: emailsSent })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }
    }
};

// Schedule configuration for Netlify Functions
exports.schedule = "*/15 * * * *";