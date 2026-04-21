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

        // Validate required fields
        if (!name || !email || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: name, email, role' })
            };
        }

        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.SENDER_EMAIL || "noreply@standupphelo.com";

        if (!apiKey) {
            console.error('BREVO_API_KEY not set');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Email service not configured. Check BREVO_API_KEY.' })
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

        // Call Brevo API directly
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
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
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Brevo API error (${response.status}):`, errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: 'Failed to send email',
                    details: errorData,
                    hint: `Make sure sender email "${senderEmail}" is verified in Brevo and BREVO_API_KEY is valid.`
                })
            };
        }

        const result = await response.json();
        console.log(`Welcome email sent successfully to ${email}`, result);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Welcome email sent to ${name}`,
                messageId: result.messageId
            })
        };

    } catch (error) {
        console.error('Error in send-welcome function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to send welcome email',
                details: error.message
            })
        };
    }
};