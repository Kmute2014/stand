import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, CheckCircle, FileText, Calendar, Target, MessageSquare } from 'lucide-react';
import { useAppContext } from '../store';
import { StandupResponse } from '../types';
import { UserStory, Epic, Project } from '../types/project';
import { aiService, aiHelpers, testAPIKey } from '../services/aiService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAgent: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const { currentUser, users, userStories, epics, responses, projects, showToast } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewTask, setHasNewTask] = useState(false);
  const [needsStandup, setNeedsStandup] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && currentUser) {
      checkUserStatus();
      sendWelcomeMessage();
    }
  }, [isOpen, currentUser]);

  const checkUserStatus = () => {
    if (!currentUser) return;

    // Check for new task assignments
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const assignedStories = userStories.filter(story =>
      story.user === currentUser.id &&
      story.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) === today
    );
    setHasNewTask(assignedStories.length > 0);

    // Check if user needs to do standup
    const todayResponse = responses.find(r =>
      r.userId === currentUser.id &&
      r.date === today
    );
    setNeedsStandup(!todayResponse);
  };

  const sendWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Hello ${currentUser?.name}! 👋 I'm your AI assistant. I can help you with:

📝 **Stand-up responses** - Write or improve your daily stand-up
🔔 **Task notifications** - Get notified about new assignments
📊 **Weekly reports** - Generate reports based on your progress
📋 **Epic & Story writing** - Help with creating epics and user stories

How can I assist you today?`,
      timestamp: new Date()
    };

    // Add status notifications
    const notifications: Message[] = [];

    if (hasNewTask) {
      notifications.push({
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '🎯 **New Task Alert**: You have been assigned new tasks! Check your Sprint Board for details.',
        timestamp: new Date(),
        action: 'view-tasks'
      });
    }

    if (needsStandup) {
      notifications.push({
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: '⏰ **Stand-up Reminder**: You haven\'t completed your daily stand-up yet. Would you like help writing it?',
        timestamp: new Date(),
        action: 'standup-reminder'
      });
    }

    setMessages([welcomeMessage, ...notifications]);
  };

  const generateStandupResponse = async (type: 'help' | 'rewrite', currentResponse?: string) => {
    setIsTyping(true);
    setAiError(null);

    try {
      let response = '';

      if (useRealAI) {
        // Use real AI service
        const currentUserStories = userStories.filter(story =>
          story.user === currentUser?.id &&
          story.status !== 'Completed'
        );

        if (type === 'help') {
          const userContext = {
            currentUser,
            activeTasks: currentUserStories,
            totalTasks: userStories.length,
            completedTasks: userStories.filter(s => s.status === 'Completed').length
          };
          const aiResponse = await aiHelpers.generateStandupResponse(currentUserStories, undefined, userContext);
          response = aiResponse.content;
        } else if (type === 'rewrite' && currentResponse) {
          const userContext = {
            currentUser,
            totalTasks: userStories.length,
            completedTasks: userStories.filter(s => s.status === 'Completed').length
          };
          const aiResponse = await aiHelpers.generateStandupResponse([], currentResponse, userContext);
          response = aiResponse.content;
        }
      } else {
        // Use simulated responses
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing

        if (type === 'help') {
          const currentUserStories = userStories.filter(story =>
            story.user === currentUser?.id &&
            story.status !== 'Completed'
          );

          response = `Here's a template for your stand-up response:

**Yesterday:**
- Worked on ${currentUserStories.length > 0 ? currentUserStories[0].title : 'previous tasks'}
- Completed code review and testing
- Attended team planning meeting

**Today:**
- Focus on ${currentUserStories.length > 0 ? currentUserStories[0].title : 'assigned tasks'}
- Code review for team member's PR
- Update documentation

**Blockers:**
- No blockers at the moment

Would you like me to customize this based on your actual tasks?`;
        } else if (type === 'rewrite' && currentResponse) {
          response = `Here's an improved version of your stand-up:

**Yesterday:**
${currentResponse.includes('Yesterday') ? currentResponse.split('Today')[0].replace('Yesterday:', '').trim() : 'Completed assigned tasks and attended team meetings'}

**Today:**
${currentResponse.includes('Today') ? currentResponse.split('Blockers')[0].split('Today')[1].trim() : 'Continue working on assigned tasks and collaborate with team'}

**Blockers:**
${currentResponse.includes('Blockers') ? currentResponse.split('Blockers')[1].trim() : 'No blockers identified'}

This version is more structured and provides clearer updates. Does this work for you?`;
        }
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Service Error:', error);
      setAiError('AI service unavailable. Using simulated responses.');

      // Fallback to simulated response
      const fallbackResponse = `I'm having trouble connecting to the AI service. Here's a basic template:

**Yesterday:**
- Completed assigned tasks
- Attended team meetings

**Today:**
- Continue working on current tasks
- Collaborate with team members

**Blockers:**
- No blockers

Please try again later or configure your API key.`;

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateWeeklyReport = async () => {
    setIsTyping(true);
    setAiError(null);

    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const userStoriesThisWeek = userStories.filter(story =>
        story.user === currentUser?.id &&
        new Date(story.createdAt) >= weekAgo
      );

      const completedStories = userStoriesThisWeek.filter(story => story.status === 'Completed');
      const inProgressStories = userStoriesThisWeek.filter(story => story.status === 'In Progress');

      const userResponses = responses.filter(r =>
        r.userId === currentUser?.id &&
        new Date(r.date) >= weekAgo
      );

      const userData = {
        user: currentUser,
        weekRange: {
          start: weekAgo.toLocaleDateString(),
          end: today.toLocaleDateString()
        },
        tasks: {
          total: userStoriesThisWeek.length,
          completed: completedStories.length,
          inProgress: inProgressStories.length,
          completedDetails: completedStories,
          inProgressDetails: inProgressStories
        },
        standups: {
          totalResponses: userResponses.length,
          averageMood: userResponses.length > 0 ? (userResponses.reduce((sum, r) => sum + r.mood.score, 0) / userResponses.length).toFixed(1) : 'N/A',
          blockers: userResponses.filter(r => r.blockers.toLowerCase() !== 'no').length,
          responses: userResponses
        },
        team: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'Active').length
        }
      };

      let response = '';

      if (useRealAI) {
        const aiResponse = await aiHelpers.generateWeeklyReport(userData);
        response = aiResponse.content;
      } else {
        // Use simulated responses
        await new Promise(resolve => setTimeout(resolve, 2000));

        response = `# Weekly Progress Report - ${currentUser?.name}

## 📊 Task Summary
- **Total Tasks Assigned**: ${userStoriesThisWeek.length}
- **Completed**: ${completedStories.length}
- **In Progress**: ${inProgressStories.length}
- **Completion Rate**: ${userStoriesThisWeek.length > 0 ? Math.round((completedStories.length / userStoriesThisWeek.length) * 100) : 0}%

## 🎯 Completed Tasks
${completedStories.length > 0 ? completedStories.map(story => `- ✅ ${story.title}`).join('\n') : 'No completed tasks this week'}

## 🔄 In Progress
${inProgressStories.length > 0 ? inProgressStories.map(story => `- 🔄 ${story.title}`).join('\n') : 'No tasks in progress'}

## 📈 Stand-up Participation
- **Days Active**: ${userResponses.length}
- **Average Mood**: ${userResponses.length > 0 ? (userResponses.reduce((sum, r) => sum + r.mood.score, 0) / userResponses.length).toFixed(1) : 'N/A'}
- **Blockers Reported**: ${userResponses.filter(r => r.blockers.toLowerCase() !== 'no').length}

## 💡 Key Insights
${completedStories.length >= 3 ? 'Great productivity this week! Keep up the excellent work.' : 'Consider focusing on completing more tasks next week.'}

Would you like me to elaborate on any section or export this report?`;
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Weekly Report Error:', error);
      setAiError('Failed to generate weekly report. Using basic format.');

      // Fallback to basic report
      const fallbackResponse = `# Weekly Report - ${currentUser?.name}

I encountered an issue generating your detailed report. Here's a basic summary:
- Tasks completed this week: ${userStories.filter(s => s.status === 'Completed').length}
- Stand-up responses: ${responses.filter(r => r.userId === currentUser?.id).length}

Please try again or check your AI configuration.`;

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const assistWithEpicStory = async (type: 'epic' | 'story', title?: string) => {
    setIsTyping(true);
    setAiError(null);

    try {
      let response = '';

      if (useRealAI) {
        // Get project context for better templates
        const projectContext = {
          userProjects: projects.filter(p => p.programId && epics.some(e => e.programId === p.programId)),
          userEpics: epics.slice(0, 5), // Get recent epics (no createdBy property available)
          currentUser,
          totalEpics: epics.length,
          totalStories: userStories.length
        };

        if (type === 'epic') {
          const aiResponse = await aiHelpers.generateEpicTemplate(title, projectContext);
          response = aiResponse.content;
        } else {
          const epicContext = {
            userEpics: epics.slice(0, 5), // Get recent epics (no createdBy property available)
            currentUser
          };
          const aiResponse = await aiHelpers.generateUserStoryTemplate(title, epicContext);
          response = aiResponse.content;
        }
      } else {
        // Use simulated responses
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (type === 'epic') {
          response = `# Epic Template

**Title**: ${title || '[Epic Name]'}

**Description**: 
As a [user role], I want to [goal] so that [benefit].

**Acceptance Criteria**:
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

**Business Value**: [Explain the business impact]

**Estimated Timeline**: [Timeframe]

**Success Metrics**:
- [ ] Metric 1
- [ ] Metric 2

Would you like me to help you fill in these details?`;
        } else {
          response = `# User Story Template

**Title**: ${title || '[User Story Title]'}

**As a** [user role],
**I want to** [action/feature],
**So that** [benefit/value].

**Acceptance Criteria**:
- [ ] Given [context], when [action], then [expected outcome]
- [ ] Given [context], when [action], then [expected outcome]
- [ ] Given [context], when [action], then [expected outcome]

**Definition of Done**:
- [ ] Code is written and reviewed
- [ ] Tests are passing
- [ ] Documentation is updated
- [ ] Product owner acceptance

**Priority**: [High/Medium/Low]
**Points**: [Story points]

Would you like help creating a specific epic or story?`;
        }
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Epic/Story Assistance Error:', error);
      setAiError('Failed to generate template. Using basic format.');

      // Fallback to basic template
      const fallbackResponse = `# ${type === 'epic' ? 'Epic' : 'User Story'} Template

I encountered an issue generating your template. Here's a basic structure:

${type === 'epic' ? `
**Title**: [Epic Name]
**Description**: Business value and goals
**Acceptance Criteria**: Key requirements
**Timeline**: Estimated completion time
` : `
**Title**: [User Story Title]
**As a** [user], **I want** [action], **so that** [benefit]
**Acceptance Criteria**: Testable requirements
**Definition of Done**: Completion criteria
`}

Please try again or check your AI configuration.`;

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const message = messageText.toLowerCase();
      let response = '';

      if (message.includes('standup') || message.includes('stand up')) {
        if (message.includes('rewrite') || message.includes('improve')) {
          response = 'Please share your current stand-up response, and I\'ll help you improve it.';
        } else {
          await generateStandupResponse('help');
          return;
        }
      } else if (message.includes('report') || message.includes('weekly')) {
        await generateWeeklyReport();
        return;
      } else if (message.includes('epic')) {
        await assistWithEpicStory('epic');
        return;
      } else if (message.includes('story') || message.includes('user story')) {
        await assistWithEpicStory('story');
        return;
      } else if (message.includes('task') || message.includes('assigned')) {
        response = `You have ${userStories.filter(s => s.user === currentUser?.id && s.status !== 'Completed').length} active tasks. Would you like me to help you prioritize them or generate a status report?`;
      } else if (message.includes('help')) {
        response = `I can help you with:
- 📝 Writing or improving stand-up responses
- 📊 Generating weekly progress reports
- 🎯 Creating epics and user stories
- 🔔 Notifying you about new tasks
- 📋 Task prioritization and management
- 🎯 General application guidance

What would you like assistance with?`;
      } else {
        // Use the new application help function for general queries
        if (useRealAI) {
          const userContext = {
            currentUser,
            activeTasks: userStories.filter(s => s.user === currentUser?.id && s.status !== 'Completed'),
            totalTasks: userStories.length,
            completedTasks: userStories.filter(s => s.status === 'Completed').length,
            recentResponses: responses.filter(r => r.userId === currentUser?.id).slice(-5),
            userRole: currentUser?.role
          };

          const aiResponse = await aiHelpers.getApplicationHelp(messageText, userContext);
          response = aiResponse.content;
        } else {
          response = 'I understand you need help. Could you be more specific about what you\'d like assistance with? You can ask me about stand-ups, reports, epics, user stories, or tasks. Enable real AI for more detailed assistance.';
        }
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Message handling error:', error);
      setAiError('Failed to process your message. Please try again.');

      const fallbackResponse = 'I encountered an issue processing your request. Please try again or enable real AI for better assistance.';

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const testAPIConnection = async () => {
    setIsTyping(true);
    setAiError(null);

    try {
      const result = await testAPIKey();

      const testMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: result.success
          ? `🎉 **API Test Results**

${result.message}

**Details:**
- Model: ${result.details?.model}
- Response: "${result.details?.response}"
- Usage: ${JSON.stringify(result.details?.usage, null, 2)}

Your Google Gemini API key is working perfectly! You can now enable real AI in the assistant.`
          : `❌ **API Test Failed**

${result.message}

**Error Details:**
${JSON.stringify(result.details, null, 2)}

**Troubleshooting:**
1. Check your API key in environment variables
2. Verify the key starts with "AIza..."
3. Ensure you have internet connection
4. Check if you have API quota available

Please fix the issue and try again.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, testMessage]);
    } catch (error) {
      console.error('Test error:', error);
      setAiError('Failed to test API connection');

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ Failed to test API connection. Please check your console for details.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'view-tasks':
        // Navigate to Sprint Board
        window.location.hash = '#sprintboard';
        break;
      case 'standup-reminder':
        generateStandupResponse('help');
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs opacity-90">
                {useRealAI ? '🟢 Real AI Enabled' : '🟡 Simulated Responses'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseRealAI(!useRealAI)}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-xs transition-colors"
            >
              {useRealAI ? 'Disable AI' : 'Enable AI'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                {message.action && (
                  <button
                    onClick={() => handleActionClick(message.action!)}
                    className="mb-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Take Action
                  </button>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {aiError && (
            <div className="flex justify-start">
              <div className="bg-yellow-100 text-yellow-800 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{aiError}</span>
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your tasks, stand-ups, or reports..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => generateStandupResponse('help')}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              📝 Stand-up Help
            </button>
            <button
              onClick={() => generateWeeklyReport()}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              📊 Weekly Report
            </button>
            <button
              onClick={() => assistWithEpicStory('epic')}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              🎯 Epic Template
            </button>
            <button
              onClick={() => assistWithEpicStory('story')}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              📋 Story Template
            </button>
            <button
              onClick={() => testAPIConnection()}
              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors font-medium"
            >
              🔧 Test API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
