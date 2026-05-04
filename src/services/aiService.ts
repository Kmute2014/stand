// AI Service for real AI integration
// Add your API key here and uncomment the code to enable real AI responses

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configuration - Add your API key here
const AI_CONFIG = {
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key-here',
  OPENAI_MODEL: 'gpt-3.5-turbo',

  // Alternative: Anthropic Claude
  ANTHROPIC_API_KEY: process.env.REACT_APP_ANTHROPIC_API_KEY || 'your-anthropic-api-key-here',
  ANTHROPIC_MODEL: 'claude-3-haiku-20240307',

  // Alternative: Google Gemini
  GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || '',
  GOOGLE_MODEL: 'gemini-pro',
};

// OpenAI Integration
export const openAIService = {
  async generateResponse(prompt: string, context?: any): Promise<AIResponse> {
    if (!AI_CONFIG.OPENAI_API_KEY || AI_CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a helpful AI assistant for a project management application. 
              You help users with stand-up responses, epic/user story writing, weekly reports, and task management.
              Be concise, helpful, and provide actionable advice.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
};

// Anthropic Claude Integration
export const anthropicService = {
  async generateResponse(prompt: string, context?: any): Promise<AIResponse> {
    if (!AI_CONFIG.ANTHROPIC_API_KEY || AI_CONFIG.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_CONFIG.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: AI_CONFIG.ANTHROPIC_MODEL,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are a helpful AI assistant for a project management application. 
              You help users with stand-up responses, epic/user story writing, weekly reports, and task management.
              Be concise, helpful, and provide actionable advice.\n\n${prompt}`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.content[0].text,
        usage: data.usage
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }
};

// Google Gemini Integration
export const geminiService = {
  async generateResponse(prompt: string, context?: any): Promise<AIResponse> {
    if (!AI_CONFIG.GOOGLE_API_KEY || AI_CONFIG.GOOGLE_API_KEY === 'AIzaSyCnP3VT6u2HLuwt6UO1XadLXZrSD2v1g0c') {
      throw new Error('Google API key not configured');
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.GOOGLE_MODEL}:generateContent?key=${AI_CONFIG.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful AI assistant for a project management application. 
                  You help users with stand-up responses, epic/user story writing, weekly reports, and task management.
                  Be concise, helpful, and provide actionable advice.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.candidates[0].content.parts[0].text,
        usage: data.usageMetadata
      };
    } catch (error) {
      console.error('Google API error:', error);
      throw error;
    }
  }
};

// Unified AI Service - Choose your provider
export const aiService = {
  // Change this to use different providers: 'openai' | 'anthropic' | 'gemini'
  provider: 'gemini' as const,

  async generateResponse(prompt: string, context?: any): Promise<AIResponse> {
    try {
      switch (this.provider) {
        case 'openai':
          return await openAIService.generateResponse(prompt, context);
        case 'anthropic':
          return await anthropicService.generateResponse(prompt, context);
        case 'gemini':
          return await geminiService.generateResponse(prompt, context);
        default:
          throw new Error('Unsupported AI provider');
      }
    } catch (error) {
      console.error('AI Service error:', error);
      // Fallback to simulated responses if API fails
      throw error;
    }
  }
};

// Application knowledge base and context
const getApplicationContext = () => {
  return {
    application: {
      name: "Project Phelo",
      type: "Project Management & Stand-up Tracking System",
      features: [
        "Daily stand-up responses with mood tracking",
        "Sprint board with user stories and epics",
        "Team mood analytics",
        "Weekly progress reports",
        "Task assignment and tracking",
        "Project and program management",
        "User role management (Admin, User, Project Manager)"
      ],
      workflows: [
        "Users submit daily stand-ups with yesterday/today/blockers",
        "Managers create epics and user stories",
        "Team members work on assigned tasks",
        "Progress tracked through sprint boards",
        "Weekly reports generated from user data"
      ]
    },
    terminology: {
      "Epic": "Large body of work that can be broken down into smaller stories",
      "User Story": "Feature requirement from user perspective",
      "Sprint": "Time-boxed period for work completion",
      "Stand-up": "Daily meeting for team synchronization",
      "Blockers": "Obstacles preventing task completion",
      "Mood Score": "1-5 scale for team sentiment"
    },
    bestPractices: {
      standup: "Focus on yesterday's accomplishments, today's plans, and blockers",
      userStories: "Follow format: As a [user], I want [action] so that [benefit]",
      epics: "Should deliver significant business value",
      reporting: "Include metrics, insights, and actionable recommendations"
    }
  };
};

// Test API key connection
export const testAPIKey = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    if (!AI_CONFIG.GOOGLE_API_KEY || AI_CONFIG.GOOGLE_API_KEY === '') {
      return {
        success: false,
        message: 'No Google Gemini API key found. Please add GEMINI_API_KEY to your environment variables.'
      };
    }

    // Test with a simple request
    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.GOOGLE_MODEL}:generateContent?key=${AI_CONFIG.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Hello! Please respond with "API test successful" to confirm the connection is working.'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        },
      }),
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      return {
        success: false,
        message: `API Error: ${testResponse.status} ${testResponse.statusText}`,
        details: errorData
      };
    }

    const data = await testResponse.json();

    if (data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0].content.parts[0].text;
      return {
        success: true,
        message: '✅ Google Gemini API key is working correctly!',
        details: {
          model: AI_CONFIG.GOOGLE_MODEL,
          response: responseText,
          usage: data.usageMetadata || 'No usage data'
        }
      };
    } else {
      return {
        success: false,
        message: 'API returned unexpected response format',
        details: data
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
};

// Helper functions for specific AI tasks with application context
export const aiHelpers = {
  generateStandupResponse: (userTasks: any[], currentResponse?: string, userContext?: any) => {
    const context = getApplicationContext();
    const taskInfo = userTasks.map(task => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      description: task.description
    }));

    const prompt = currentResponse
      ? `Please rewrite and improve this stand-up response: "${currentResponse}"
      
      Context: You are helping a user in the Project Phelo application. The user has these active tasks:
      ${JSON.stringify(taskInfo, null, 2)}
      
      Application context: ${JSON.stringify(context.terminology, null, 2)}
      
      Best practices: ${context.bestPractices.standup}`

      : `Generate a personalized stand-up response for a user in the Project Phelo application.
      
      User's active tasks:
      ${JSON.stringify(taskInfo, null, 2)}
      
      Application context: This is a project management system where users track daily progress.
      Terminology: ${JSON.stringify(context.terminology, null, 2)}
      
      Best practices for stand-ups: ${context.bestPractices.standup}
      
      Generate a response that follows the Yesterday/Today/Blockers format and references the user's actual tasks.`;

    return aiService.generateResponse(prompt);
  },

  generateWeeklyReport: (userData: any) => {
    const context = getApplicationContext();

    const prompt = `Generate a comprehensive weekly progress report for the Project Phelo application.
    
    User data:
    ${JSON.stringify(userData, null, 2)}
    
    Application context: ${JSON.stringify(context.application, null, 2)}
    
    Terminology: ${JSON.stringify(context.terminology, null, 2)}
    
    Best practices for reporting: ${context.bestPractices.reporting}
    
    Create a professional report that includes:
    1. Executive summary
    2. Task completion metrics
    3. Stand-up participation analysis
    4. Team mood trends
    5. Blockers and resolutions
    6. Recommendations for next week
    
    Use the application's terminology and format it professionally.`;

    return aiService.generateResponse(prompt);
  },

  generateEpicTemplate: (title?: string, projectContext?: any) => {
    const context = getApplicationContext();

    const prompt = title
      ? `Generate an epic template for "${title}" in the Project Phelo application.
      
      Project context: ${JSON.stringify(projectContext, null, 2)}
      
      Application context: ${JSON.stringify(context.application, null, 2)}
      
      Epic definition: ${context.terminology.Epic}
      
      Best practices: ${context.bestPractices.epics}
      
      Create a comprehensive epic template that includes:
      1. Clear business value
      2. Acceptance criteria
      3. Success metrics
      4. Dependencies
      5. Timeline estimates
      6. Risk assessment`

      : `Generate a comprehensive epic template for the Project Phelo application.
      
      Application context: ${JSON.stringify(context.application, null, 2)}
      
      Epic definition: ${context.terminology.Epic}
      
      Best practices: ${context.bestPractices.epics}
      
      Include examples and guidance for creating effective epics that deliver business value.`;

    return aiService.generateResponse(prompt);
  },

  generateUserStoryTemplate: (title?: string, epicContext?: any) => {
    const context = getApplicationContext();

    const prompt = title
      ? `Generate a user story template for "${title}" in the Project Phelo application.
      
      Epic context: ${JSON.stringify(epicContext, null, 2)}
      
      Application context: ${JSON.stringify(context.application, null, 2)}
      
      User story definition: ${context.terminology["User Story"]}
      
      Best practices: ${context.bestPractices.userStories}
      
      Create a detailed user story template that includes:
      1. Proper user story format
      2. Acceptance criteria with Given/When/Then
      3. Definition of Done
      4. Priority and estimation guidance
      5. Technical considerations`

      : `Generate a comprehensive user story template for the Project Phelo application.
      
      Application context: ${JSON.stringify(context.application, null, 2)}
      
      User story definition: ${context.terminology["User Story"]}
      
      Best practices: ${context.bestPractices.userStories}
      
      Include examples and guidance for writing effective user stories that deliver user value.`;

    return aiService.generateResponse(prompt);
  },

  // New helper for general application assistance
  getApplicationHelp: (query: string, userContext?: any) => {
    const context = getApplicationContext();

    const prompt = `Provide helpful assistance for a user query in the Project Phelo application.
    
    User query: "${query}"
    
    User context: ${JSON.stringify(userContext, null, 2)}
    
    Application context: ${JSON.stringify(context.application, null, 2)}
    
    Terminology: ${JSON.stringify(context.terminology, null, 2)}
    
    Provide specific, actionable guidance that helps the user accomplish their goals in this application.
    Reference actual features and workflows available in the system.`;

    return aiService.generateResponse(prompt);
  }
};
