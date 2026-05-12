// functions/index.ts
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as brevo from '@getbrevo/brevo';
import * as dotenv from 'dotenv';

// Load .env variables from functions directory
dotenv.config({ path: __dirname + '/.env' });

// Validate that BREVO_API_KEY is set
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not set in .env file');
}

admin.initializeApp();
const db = admin.firestore();

// Setup Brevo API client using process.env
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// --- Helper to Send Email via Brevo ---
async function sendBrevoEmail(toEmail: string, subject: string, text: string) {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.sender = { "name": "StandUpPhelo", "email": "encrypted2009@proton.me" }; // Ensure this matches Brevo verified sender
    sendSmtpEmail.to = [{ "email": toEmail }];
    sendSmtpEmail.textContent = text;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error: any) {
    console.error(`Error sending email to ${toEmail}:`, error.message || error);
    throw new Error(`Email service error: ${error.message || 'Failed to send email'}`);
  }
}

// --- GOAL 1: Admin Alert for Blockers ---
export const onStandupResponseCreated = functions.firestore.onDocumentCreated(
  { document: 'responses/{responseId}' },
  async (event) => {
    const data = event.data?.data();
    if (data?.blockers && data.blockers.length > 0) {
      await sendBrevoEmail(
        process.env.ADMIN_EMAIL || "admin@yourdomain.com",
        "🛑 BLOCKER ALERT: New response",
        `User ${data.userName} reported a blocker: "${data.blockers}"`
      );
    }
  }
);

// --- GOAL 2: User Standup Reminders (Scheduled) ---
export const scheduledStandupReminder = functions.scheduler.onSchedule(
  { schedule: 'every 1 minutes', region: 'europe-west2' },
  async (event) => {
    const now = new Date();
    const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const scheduleDoc = await db.collection('settings').doc('schedule').get();
    const scheduleData = scheduleDoc.data();

    // Check if auto reminders are enabled
    if (!scheduleData?.autoEnabled) {
      return;
    }

    // Check if current time matches scheduled time AND current day is an active day
    if (scheduleData?.time === current && scheduleData?.activeDays?.includes(currentDay)) {
      console.log(`Sending reminders at ${current} on ${currentDay}`);

      // Get all active users (excluding admins)
      const usersSnap = await db.collection('users')
        .where('status', '==', 'Active')
        .where('role', '!=', 'Admin')
        .get();

      // Check which users haven't submitted today's standup
      const today = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const responsesSnap = await db.collection('responses')
        .where('date', '==', today)
        .get();

      const submittedUserIds = new Set(responsesSnap.docs.map(doc => doc.data().userId));

      let emailsSent = 0;
      for (const doc of usersSnap.docs) {
        const userData = doc.data();

        // Only send to users who haven't submitted today
        if (!submittedUserIds.has(doc.id)) {
          try {
            await sendBrevoEmail(
              userData.email,
              "Daily Standup Reminder",
              `Hello ${userData.name}! It's time to submit your daily standup on StandUpPhelo. Click here to submit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
            );
            emailsSent++;
            console.log(`Reminder sent to ${userData.email}`);
          } catch (error) {
            console.error(`Failed to send reminder to ${userData.email}:`, error);
          }
        }
      }

      // Log the reminder activity
      await db.collection('notifications').add({
        id: Date.now().toString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Auto',
        text: `Automatic reminders sent to ${emailsSent} users on ${currentDay} at ${current}`,
        createdAt: now.toISOString()
      });

      console.log(`Automatic reminders completed: ${emailsSent} emails sent`);
    }
  }
);

// --- GOAL 3: HTTP Callable - Manual Reminder Trigger ---
export const sendStandupReminder = functions.https.onCall(
  { region: 'europe-west2' },
  async (request) => {
    try {
      const now = new Date();
      const today = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Get all active users (excluding admins)
      const usersSnap = await db.collection('users')
        .where('status', '==', 'Active')
        .where('role', '!=', 'Admin')
        .get();

      if (usersSnap.empty) {
        return { success: true, message: 'No active users to remind' };
      }

      // Check which users haven't submitted today's standup
      const responsesSnap = await db.collection('responses')
        .where('date', '==', today)
        .get();

      const submittedUserIds = new Set(responsesSnap.docs.map(doc => doc.data().userId));

      let emailsSent = 0;
      for (const doc of usersSnap.docs) {
        const userData = doc.data();

        // Only send to users who haven't submitted today
        if (!submittedUserIds.has(doc.id)) {
          try {
            await sendBrevoEmail(
              userData.email,
              "Daily Standup Reminder",
              `Hello ${userData.name}! It's time to submit your daily standup on StandUpPhelo. Click here to submit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
            );
            emailsSent++;
            console.log(`Manual reminder sent to ${userData.email}`);
          } catch (error) {
            console.error(`Failed to send manual reminder to ${userData.email}:`, error);
          }
        }
      }

      return { success: true, message: `Reminders sent to ${emailsSent} users` };
    } catch (error) {
      console.error('Error in sendStandupReminder:', error);
      throw new functions.https.HttpsError('internal', 'Failed to send reminders');
    }
  }
);

// --- GOAL 4: Generate Password Reset Link ---
export const generatePasswordResetLink = functions.https.onCall(
  { region: 'europe-west2' },
  async (request) => {
    try {
      const { email } = request.data;

      if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email is required');
      }

      // Generate password reset link using Firebase Admin SDK
      const resetLink = await admin.auth().generatePasswordResetLink(email);
      return { success: true, resetLink };
    } catch (error: any) {
      console.error('Error generating password reset link:', error);
      throw new functions.https.HttpsError('internal', `Failed to generate reset link: ${error.message}`);
    }
  }
);
