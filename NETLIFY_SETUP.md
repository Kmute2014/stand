# Netlify Deployment Setup

## Welcome Email Setup

This project uses Netlify Functions to send welcome emails when new users are added.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables in Netlify
Go to your Netlify dashboard → Site settings → Environment variables:

- `BREVO_API_KEY`: Your Brevo (Sendinblue) API key

### 3. Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

Or connect your GitHub repository to Netlify for automatic deployments.

### 4. Configure Brevo
1. Sign up at [Brevo](https://www.brevo.com/)
2. Get your API key from Account → SMTP & API
3. Verify your sender email (`no-reply@yourdomain.com`) in the Brevo dashboard

### 5. Test
Add a new user in the app - they should receive a welcome email automatically.

## Alternative: Local Development
For local testing, create a `.env` file in the project root:
```
BREVO_API_KEY=your_api_key_here
```

Then run:
```bash
netlify dev
```

The function will be available at `http://localhost:8888/.netlify/functions/send-welcome`