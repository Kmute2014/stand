# Google Gemini AI Setup Guide

## Quick Setup for Google Gemini

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (starts with `AIza...`)

### 2. Configure Your Environment
Create or update your `.env.local` file:

```bash
# Google Gemini API Key
GEMINI_API_KEY="AIza...your-actual-api-key-here"
```

### 3. Restart Your Application
```bash
npm start
```

### 4. Enable Real AI in the App
1. Open the AI Assistant from the sidebar
2. Click "Enable AI" button
3. Status should show "🟢 Real AI Enabled"

## Why Google Gemini?

✅ **Free Tier Available** - Generous free tier for development
✅ **Fast Responses** - Quick response times
✅ **Good Performance** - Excellent for productivity tasks
✅ **Easy Setup** - Simple API key configuration
✅ **Cost Effective** - Lower costs compared to other providers

## Features with Gemini

### Stand-up Assistance
- Context-aware response generation
- Intelligent rewriting of existing responses
- Personalized based on your actual tasks

### Report Generation
- Comprehensive weekly progress reports
- Task completion analysis
- Team mood and blocker insights

### Epic & Story Writing
- Professional epic templates
- User story generation
- Acceptance criteria suggestions

## Troubleshooting

### "AI service unavailable" Error
1. Verify your API key is correct
2. Check you have internet connection
3. Ensure the key starts with `AIza...`
4. Try regenerating a new API key

### API Key Issues
- Don't include quotes around the key
- Ensure no extra spaces
- Check the key is active in Google AI Studio

### Response Issues
- Toggle AI off and on again
- Check browser console for errors
- Verify your Gemini API quota

## Cost Information

### Free Tier
- **60 requests per minute**
- **Free for development and testing**
- **No credit card required**

### Paid Tier (if needed)
- **$0.00025 per 1K tokens**
- **Typical response: ~100-500 tokens**
- **Cost per response: ~$0.000025-$0.000125**

## Security Notes

- ✅ Store API key in environment variables
- ✅ Never commit API keys to git
- ✅ Use separate keys for development/production
- ✅ Monitor usage in Google AI Studio

## Advanced Configuration

### Customizing Prompts
You can modify the system prompt in `src/services/aiService.ts`:

```typescript
messages: [
  {
    role: 'user',
    content: `You are a helpful AI assistant for a project management application. 
    You help users with stand-up responses, epic/user story writing, weekly reports, and task management.
    Be concise, helpful, and provide actionable advice.\n\n${prompt}`
  }
]
```

### Adjusting Parameters
Modify the generation config in `geminiService`:

```typescript
generationConfig: {
  temperature: 0.7,        // Creativity (0.0-1.0)
  maxOutputTokens: 1000,  // Response length
  topP: 0.8,            // Nucleus sampling
  topK: 40,             // Top-k sampling
}
```

## Testing Your Setup

### Quick Test
1. Open AI Assistant
2. Enable Real AI
3. Type: "Help me write a stand-up response"
4. Should get a personalized response

### Verify API Key
Check browser console for:
```
✅ Google Gemini API connected successfully
```

## Support

If you need help:
1. Check [Google AI Studio](https://aistudio.google.com/)
2. Review API usage and quotas
3. Check browser console for errors
4. Try regenerating your API key

## Next Steps

Once set up:
- Try stand-up response generation
- Generate a weekly report
- Create epic and user story templates
- Explore conversational AI features

Enjoy your AI-powered productivity assistant! 🚀
