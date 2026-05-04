# AI Assistant Setup Guide

## Overview
The AI Assistant can operate in two modes:
1. **Simulated Mode** - Uses template-based responses (default)
2. **Real AI Mode** - Connects to actual AI services for intelligent responses

## API Key Configuration

### Option 1: OpenAI (GPT-3.5, GPT-4)
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your environment variables:
   ```bash
   REACT_APP_OPENAI_API_KEY="sk-your-openai-api-key-here"
   ```

### Option 2: Anthropic Claude
1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to your environment variables:
   ```bash
   REACT_APP_ANTHROPIC_API_KEY="your-anthropic-api-key-here"
   ```

### Option 3: Google Gemini
1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to your environment variables:
   ```bash
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

## Environment Setup

### 1. Create Environment File
Copy the example environment file:
```bash
cp .env.example .env.local
```

### 2. Add Your API Key
Edit `.env.local` and add your preferred API key:
```bash
# Choose ONE of the following:
REACT_APP_OPENAI_API_KEY="sk-your-openai-api-key-here"
# OR
REACT_APP_ANTHROPIC_API_KEY="your-anthropic-api-key-here"
# OR
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Restart Your Application
```bash
npm start
```

## Usage

### Enabling Real AI
1. Open the AI Assistant from the sidebar
2. Click the "Enable AI" button in the header
3. The assistant will now use real AI responses

### Disabling Real AI
1. Click the "Disable AI" button in the header
2. The assistant will revert to simulated responses

## Features

### Real AI Mode Provides:
- **Intelligent Stand-up Responses**: Context-aware responses based on your actual tasks
- **Smart Rewriting**: Improves your existing stand-up responses
- **Dynamic Report Generation**: Creates personalized weekly reports
- **Adaptive Templates**: Generates customized epic and user story templates
- **Natural Conversations**: Understands context and provides relevant assistance

### Simulated Mode Provides:
- **Template Responses**: High-quality templates for common tasks
- **Instant Responses**: No API delays
- **Offline Functionality**: Works without internet connection
- **Cost-Free**: No API usage charges

## Troubleshooting

### Common Issues

#### "AI service unavailable" Error
- Check your API key is correctly set in `.env.local`
- Ensure you have sufficient API credits/tokens
- Verify your internet connection
- Try switching to a different AI provider

#### API Key Not Working
- Ensure the API key doesn't have quotes around it
- Check for extra spaces or special characters
- Verify the key is valid and active
- Check API usage limits and billing

#### Real AI Not Responding
- Toggle AI off and on again
- Check browser console for error messages
- Verify API key permissions
- Try a different AI provider

### Error Messages

#### `AI service unavailable. Using simulated responses.`
- The AI service failed to connect
- Check your API key configuration
- Verify internet connectivity
- Try again later

#### `OpenAI API key not configured`
- Add your OpenAI API key to environment variables
- Restart the application
- Try again

## API Usage Costs

### OpenAI (GPT-3.5-turbo)
- ~$0.002 per 1K tokens
- Typical usage: ~100-500 tokens per response
- Estimated cost: $0.0002-$0.001 per response

### Anthropic Claude
- ~$0.00025 per 1K tokens (Claude Instant)
- Typical usage: ~100-500 tokens per response
- Estimated cost: $0.000025-$0.000125 per response

### Google Gemini
- Free tier available
- Paid tier: ~$0.00025 per 1K tokens
- Typical usage: ~100-500 tokens per response

## Security Notes

- **Never commit API keys to version control**
- **Use environment variables for all API keys**
- **Rotate API keys regularly**
- **Monitor API usage and costs**
- **Use API keys with appropriate permissions**

## Development Tips

### Testing with Simulated Mode
- Develop and test features using simulated responses
- Switch to real AI only for final testing
- This saves API costs during development

### Monitoring Usage
- Check your AI provider's dashboard for usage stats
- Monitor costs and set up alerts if needed
- Use rate limiting if required

### Custom Prompts
- Modify system prompts in `aiService.ts` for different behaviors
- Adjust temperature and max_tokens for different use cases
- Add custom prompts for specific features

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key configuration
3. Ensure you have sufficient API credits
4. Try switching to a different AI provider
5. Contact your AI provider's support for API issues

## Future Enhancements

Planned improvements:
- Support for more AI providers
- Custom prompt engineering
- Response caching
- Usage analytics
- Cost optimization features
