// JIRA API Service
// This service handles all interactions with JIRA's REST API

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: {
      content?: Array<{
        content?: Array<{
          text?: string;
        }>;
      }>;
    };
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    created: string;
  };
}

interface CreateIssueData {
  summary: string;
  description?: string;
  priority: string;
  issuetype: string;
  assignee?: string;
}

class JiraService {
  private config: JiraConfig | null = null;

  configure(config: JiraConfig) {
    this.config = config;
  }

  private getAuthHeader(): string {
    if (!this.config) {
      throw new Error('JIRA not configured. Call configure() first.');
    }
    const credentials = btoa(`${this.config.email}:${this.config.apiToken}`);
    return `Basic ${credentials}`;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.config) {
      throw new Error('JIRA not configured. Call configure() first.');
    }

    const url = `${this.config.baseUrl}/rest/api/3${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JIRA API error: ${response.status} - ${errorText}`);
    }

    return response;
  }

  async getIssues(jql: string = '', maxResults: number = 50): Promise<JiraIssue[]> {
    try {
      const endpoint = `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,description,status,priority,issuetype,assignee,created`;
      const response = await this.request(endpoint);
      const data = await response.json();
      return data.issues || [];
    } catch (error) {
      console.error('Error fetching JIRA issues:', error);
      throw error;
    }
  }

  async getIssue(issueKeyOrId: string): Promise<JiraIssue> {
    try {
      const endpoint = `/issue/${issueKeyOrId}?fields=summary,description,status,priority,issuetype,assignee,created`;
      const response = await this.request(endpoint);
      return await response.json();
    } catch (error) {
      console.error('Error fetching JIRA issue:', error);
      throw error;
    }
  }

  async createIssue(projectKey: string, data: CreateIssueData): Promise<JiraIssue> {
    try {
      const payload = {
        fields: {
          project: {
            key: projectKey,
          },
          summary: data.summary,
          description: data.description ? {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: data.description,
                  },
                ],
              },
            ],
          } : undefined,
          issuetype: {
            name: data.issuetype,
          },
          priority: {
            name: data.priority,
          },
          ...(data.assignee && {
            assignee: {
              accountId: data.assignee,
            },
          }),
        },
      };

      const response = await this.request('/issue', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating JIRA issue:', error);
      throw error;
    }
  }

  async updateIssue(issueKeyOrId: string, data: Partial<CreateIssueData>): Promise<void> {
    try {
      const payload: any = {};

      if (data.summary) {
        payload.fields = {
          ...payload.fields,
          summary: data.summary,
        };
      }

      if (data.description) {
        payload.fields = {
          ...payload.fields,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: data.description,
                  },
                ],
              },
            ],
          },
        };
      }

      if (data.priority) {
        payload.fields = {
          ...payload.fields,
          priority: {
            name: data.priority,
          },
        };
      }

      if (data.issuetype) {
        payload.fields = {
          ...payload.fields,
          issuetype: {
            name: data.issuetype,
          },
        };
      }

      if (data.assignee) {
        payload.fields = {
          ...payload.fields,
          assignee: {
            accountId: data.assignee,
          },
        };
      }

      await this.request(`/issue/${issueKeyOrId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error updating JIRA issue:', error);
      throw error;
    }
  }

  async deleteIssue(issueKeyOrId: string): Promise<void> {
    try {
      await this.request(`/issue/${issueKeyOrId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting JIRA issue:', error);
      throw error;
    }
  }

  async transitionIssue(issueKeyOrId: string, transitionName: string): Promise<void> {
    try {
      // First, get available transitions
      const transitionsEndpoint = `/issue/${issueKeyOrId}/transitions`;
      const transitionsResponse = await this.request(transitionsEndpoint);
      const transitionsData = await transitionsResponse.json();
      
      const transition = transitionsData.transitions.find(
        (t: any) => t.name.toLowerCase() === transitionName.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Transition "${transitionName}" not available for this issue`);
      }

      // Execute the transition
      await this.request(`/issue/${issueKeyOrId}/transitions`, {
        method: 'POST',
        body: JSON.stringify({
          transition: {
            id: transition.id,
          },
        }),
      });
    } catch (error) {
      console.error('Error transitioning JIRA issue:', error);
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    try {
      const response = await this.request('/project');
      return await response.json();
    } catch (error) {
      console.error('Error fetching JIRA projects:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jiraService = new JiraService();
