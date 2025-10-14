import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'getting-started',
    {
      title: 'Getting Started with Circle',
      description: 'A guide for first-time users',
    },
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Welcome to Circle! Here's how to get started:

1. View your profile: "Show me my profile"
2. Explore courses: "What courses am I enrolled in?"
3. Check spaces: "List all spaces"
4. Browse posts: "Show recent posts"
5. View events: "What events are coming up?"

What would you like to do first?`,
        },
      }],
    })
  );

  server.registerPrompt(
    'course-workflow',
    {
      title: 'Course Navigation Workflow',
      description: 'Guide for accessing and completing courses',
    },
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Course Navigation Guide:

1. List all your courses: "Show my courses"
2. Get course details: "Show details for course [ID]"
3. Track your progress
4. Complete lessons systematically

Ready to start learning?`,
        },
      }],
    })
  );
}