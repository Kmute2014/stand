const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

exports.handler = async (event) => {
    try {
        const { uid } = JSON.parse(event.body);

        // 🔒 (Optional but IMPORTANT) protect this endpoint
        // You can verify Firebase ID token here if needed

        await admin.auth().setCustomUserClaims(uid, { admin: true });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "User is now admin" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};