exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { name, email, role } = JSON.parse(event.body);

        console.log('=== Send Welcome Email ===');
        console.log('Received:', { name, email, role });

        // Validate required fields
        if (!name || !email || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: name, email, role' })
            };
        }

        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || "datrixhost@gmail.com";

        console.log('Sender email:', senderEmail);
        console.log('API Key present:', !!apiKey);

        if (!apiKey) {
            console.error('BREVO_API_KEY not set');
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Email service not configured',
                    hint: 'Set BREVO_API_KEY in Netlify environment variables'
                })
            };
        }

        const emailBody = `Welcome to StandUpPhelo, ${name.split(' ')[0]}!

You've been added to the team standup system. Your role is: ${role}

You can now log in and submit your daily standups at: https://yourdomain.com/standup

Key features:
- Daily standup submissions (What you did, what you'll do, any blockers)
- Team mood tracking
- Admin blocker alerts
- Response history and analytics

If you have any questions, reach out to your admin.

Best regards,
StandUpPhelo Team`;

        const payload = {
            sender: {
                name: 'StandUpPhelo',
                email: senderEmail
            },
            to: [
                {
                    email: email,
                    name: name
                }
            ],
            subject: '👋 Welcome to StandUpPhelo!',
            textContent: emailBody
        };

        console.log('Sending to Brevo API...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        // Call Brevo API directly
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Brevo response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Brevo API error (${response.status}):`, errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: 'Failed to send email',
                    status: response.status,
                    details: errorData,
                    hint: `Verify "${senderEmail}" is verified in Brevo and API key is valid`
                })
            };
        }

        let result;
        try {
            result = await response.json();
        } catch (parseErr) {
            console.warn('Could not parse response as JSON:', parseErr);
            result = { messageId: 'unknown' };
        }

        console.log(`✓ Welcome email sent successfully to ${email}`, result);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Welcome email sent to ${name}`,
                messageId: result.messageId
            })
        };

    } catch (error) {
        console.error('=== Error in send-welcome function ===');
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to send welcome email',
                details: error.message,
                stack: error.stack
            })
        };
    }
};