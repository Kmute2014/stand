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

    const scheduleDoc = await db.collection('settings').doc('schedule').get();

    // Check time equality
    if (scheduleDoc.data()?.time === current) {
      const usersSnap = await db.collection('users').where('status', '==', 'Pending').get();

      for (const doc of usersSnap.docs) {
        await sendBrevoEmail(
          doc.data().email,
          "Daily Standup Reminder",
          "Hello! It's time to submit your daily standup on StandUpPhelo."
        );
      }
    }
  }
);

// --- GOAL 3: HTTP Callable - Manual Reminder Trigger ---
export const sendStandupReminder = functions.https.onCall(
  { region: 'europe-west2' },
  async (request) => {
    try {
      const usersSnap = await db.collection('users').where('status', '==', 'Pending').get();

      if (usersSnap.empty) {
        return { success: true, message: 'No pending users to remind' };
      }

      let emailsSent = 0;
      for (const doc of usersSnap.docs) {
        try {
          await sendBrevoEmail(
            doc.data().email,
            "Daily Standup Reminder",
            "Hello! It's time to submit your daily standup on StandUpPhelo."
          );
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${doc.data().email}:`, error);
        }
      }

      return { success: true, message: `Reminders sent to ${emailsSent} users` };
    } catch (error) {
      console.error('Error in sendStandupReminder:', error);
      throw new functions.https.HttpsError('internal', 'Failed to send reminders');
    }
  }
);
