# Circle MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.19-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Production-grade **Model Context Protocol (MCP)** server for the Circle community platform. This server enables AI assistants to interact with Circle.so communities through Google OAuth 2.0 authentication and provides 20+ tools for comprehensive community management.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
  - [Google Cloud Platform Setup](#1-google-cloud-platform-gcp-setup)
  - [Environment Variables](#2-environment-variables)
- [Building & Testing](#-building--testing)
- [IDE Integration](#-ide-integration)
  - [Claude Desktop](#1-claude-desktop)
  - [VS Code with Cline](#2-vs-code-with-cline)
  - [Other MCP Clients](#3-other-mcp-clients)
- [Available Tools](#-available-tools)
- [Usage Examples](#-usage-examples)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)
- [License](#-license)

---

## ✨ Features

### Core Capabilities
- 🔐 **Google OAuth 2.0 Integration** - Secure authentication via Google accounts
- 🔗 **Circle API Integration** - Seamless integration with Circle.so communities
- 🛡️ **JWT Token Management** - Automatic token refresh and secure storage
- 🚦 **Rate Limiting** - Built-in protection against API rate limits
- 🔄 **Request Retry Logic** - Exponential backoff for failed requests
- 📊 **Comprehensive Logging** - Winston-based structured logging
- 🎯 **20+ Tools** - Complete Circle API coverage
- 🔧 **Type-Safe** - Full TypeScript implementation with Zod validation

### Security Features
- ✅ Secure credential storage
- ✅ Automatic token refresh
- ✅ OAuth 2.0 authorization code flow
- ✅ Read-only mode support
- ✅ Environment-based configuration

---

## 🏗️ Architecture

```
┌─────────────────┐
│   AI Assistant  │ (Claude Desktop, VS Code, etc.)
└────────┬────────┘
         │ MCP Protocol (stdio)
         ▼
┌─────────────────────────────────┐
│    Circle MCP Server            │
│  ┌──────────────────────────┐  │
│  │  Integrated Auth Manager │  │
│  │  ├─ GCP OAuth 2.0        │  │
│  │  └─ Circle JWT Auth      │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  Circle API Client       │  │
│  │  ├─ Rate Limiting        │  │
│  │  ├─ Retry Logic          │  │
│  │  └─ Error Handling       │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  20+ MCP Tools           │  │
│  └──────────────────────────┘  │
└─────────────┬───────────────────┘
              │ HTTPS
              ▼
    ┌──────────────────┐
    │  Circle.so API   │
    └──────────────────┘
```

**Authentication Flow:**
1. User triggers `authenticate_with_google` tool
2. OAuth server starts on localhost:3000
3. Browser opens for Google sign-in
4. User authorizes the application
5. Server receives OAuth callback with authorization code
6. Exchanges code for GCP access/refresh tokens
7. Retrieves user email from Google
8. Authenticates with Circle API using email
9. Stores both GCP and Circle tokens securely

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **TypeScript** knowledge (helpful but not required)
- **Google Cloud Platform account** (free tier works)
- **Circle.so community** with headless access token
- **AI Assistant** that supports MCP (Claude Desktop, VS Code with Cline, etc.)

---

## 🚀 Installation

### 1. Clone or Download the Project

```bash
cd /path/to/your/projects
# If you have this as a git repo:
git clone <repository-url> circle-mcp
cd circle-mcp

# Or if you already have the folder:
cd circle-mcp
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `google-auth-library` - Google OAuth 2.0
- `googleapis` - Google APIs
- `express` - OAuth callback server
- `axios` - HTTP client
- `winston` - Logging
- `zod` - Schema validation
- And more...

---

## ⚙️ Configuration

### 1. Google Cloud Platform (GCP) Setup

#### Step 1.1: Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Circle MCP Auth")
4. Click "Create"

#### Step 1.2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

#### Step 1.3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in the required fields:
   - **App name**: Circle MCP Server
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. **Scopes**: Skip this step (click Save and Continue)
6. **Test users**: Add your Google account email
7. Click **Save and Continue**

#### Step 1.4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Circle MCP OAuth Client
   - **Authorized redirect URIs**: Add `http://localhost:3000/auth/google/callback`
5. Click **Create**
6. **Save your credentials**:
   - Copy the **Client ID** (ends with `.apps.googleusercontent.com`)
   - Copy the **Client Secret** (starts with `GOCSPX-`)

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env
```

Add the following configuration:

```env
# Circle.so Configuration
CIRCLE_HEADLESS_TOKEN=your_circle_headless_token
CIRCLE_COMMUNITY_URL=https://your-community.circle.so
CIRCLE_HEADLESS_BASE_URL=https://app.circle.so

# Google Cloud Platform OAuth 2.0
GCP_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GCP_CLIENT_SECRET=GOCSPX-your-client-secret-here
GCP_REDIRECT_URI=http://localhost:3000/auth/google/callback
OAUTH_PORT=3000

# Server Configuration
READ_ONLY_MODE=false
LOG_LEVEL=info
```

#### How to Get Circle Credentials:

1. **Circle Headless Token**:
   - Log in to your Circle community admin panel
   - Go to Settings → API
   - Generate a headless access token
   - Copy the token

2. **Circle Community URL**:
   - Your community's URL (e.g., `https://learn.1to10x.ai`)

#### Configuration Options:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CIRCLE_HEADLESS_TOKEN` | Yes | Circle API headless token | `abc123...` |
| `CIRCLE_COMMUNITY_URL` | Yes | Your Circle community URL | `https://community.circle.so` |
| `GCP_CLIENT_ID` | Yes | Google OAuth Client ID | `123-abc.apps.googleusercontent.com` |
| `GCP_CLIENT_SECRET` | Yes | Google OAuth Client Secret | `GOCSPX-abcd1234` |
| `GCP_REDIRECT_URI` | Yes | OAuth callback URL | `http://localhost:3000/auth/google/callback` |
| `OAUTH_PORT` | No | OAuth server port (default: 3000) | `3000` |
| `READ_ONLY_MODE` | No | Disable write operations (default: false) | `false` |
| `LOG_LEVEL` | No | Logging level (default: info) | `info` |

---

## 🔨 Building & Testing

### Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Verify Setup

```bash
node verify-setup.js
```

This checks:
- ✅ All required files exist
- ✅ Dependencies are installed
- ✅ Environment variables are configured
- ✅ TypeScript compiles without errors
- ✅ Port 3000 is available
- ✅ GCP credentials are valid

### Test OAuth Flow

```bash
# Configuration test
node test-oauth-flow.js

# Automated server test
node test-oauth-automated.js

# Interactive OAuth testing
node test-oauth-interactive.js
```

### Run the Server

```bash
npm start
```

---

## 🖥️ IDE Integration

### 1. Claude Desktop

Claude Desktop is Anthropic's official desktop app that supports MCP servers.

#### Step 1.1: Install Claude Desktop

Download from [claude.ai](https://claude.ai/download)

#### Step 1.2: Locate Configuration File

The configuration file location depends on your OS:

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

#### Step 1.3: Edit Configuration

Open `claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "circle": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\circle-mcp\\dist\\index.js"],
      "env": {
        "CIRCLE_HEADLESS_TOKEN": "your_circle_token_here",
        "CIRCLE_COMMUNITY_URL": "https://your-community.circle.so",
        "CIRCLE_HEADLESS_BASE_URL": "https://app.circle.so",
        "GCP_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GCP_CLIENT_SECRET": "GOCSPX-your-secret",
        "GCP_REDIRECT_URI": "http://localhost:3000/auth/google/callback",
        "OAUTH_PORT": "3000",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important Notes:**
- Replace `C:\\Users\\admin\\Desktop\\circle-mcp\\dist\\index.js` with your actual path
- On Windows, use double backslashes (`\\`) or forward slashes (`/`)
- On macOS/Linux, use forward slashes (`/`)
- Replace all credential placeholders with your actual values

#### Step 1.4: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. The Circle MCP server will start automatically

#### Step 1.5: Verify Integration

In Claude Desktop, type:

```
Can you check if the Circle MCP server is connected?
```

If connected, Claude can use tools like:
```
Please authenticate with Google so I can access Circle features.
```

### 2. VS Code with Cline

Cline is a VS Code extension that supports MCP servers.

#### Step 2.1: Install Cline Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Cline"
4. Click Install

#### Step 2.2: Configure Cline

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Cline: Open Settings"
3. Navigate to MCP Servers section
4. Click "Edit in settings.json"

Add this configuration:

```json
{
  "cline.mcpServers": {
    "circle": {
      "command": "node",
      "args": ["/absolute/path/to/circle-mcp/dist/index.js"],
      "env": {
        "CIRCLE_HEADLESS_TOKEN": "your_token",
        "CIRCLE_COMMUNITY_URL": "https://your-community.circle.so",
        "GCP_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GCP_CLIENT_SECRET": "GOCSPX-your-secret",
        "GCP_REDIRECT_URI": "http://localhost:3000/auth/google/callback"
      }
    }
  }
}
```

#### Step 2.3: Reload VS Code

1. Open Command Palette
2. Type "Developer: Reload Window"
3. Press Enter

#### Step 2.4: Use Circle Tools in Cline

Open Cline chat and try:
```
Authenticate with Google to access Circle community
```

### 3. Other MCP Clients

#### MCP Inspector (Testing Tool)

For development and debugging:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Then open http://localhost:6274 in your browser.

#### Custom Integration

Any MCP-compatible client can connect using stdio transport:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/circle-mcp/dist/index.js'],
  env: { /* environment variables */ }
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);
```

---

## 🛠️ Available Tools

The Circle MCP server provides 20+ tools across multiple categories:

### Authentication Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `authenticate_with_google` | Start Google OAuth flow | No |
| `check_auth_status` | Check current authentication status | No |
| `logout` | Logout and clear tokens | Yes |

### Profile Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_my_profile` | Get your Circle profile | Yes |
| `update_my_profile` | Update your profile | Yes |

### Course Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_my_courses` | Get courses you're enrolled in | Yes |
| `get_course_details` | Get detailed course information | Yes |

### Post Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_posts` | Get posts from community | Yes |
| `create_post` | Create a new post | Yes |
| `update_post` | Update an existing post | Yes |
| `delete_post` | Delete a post | Yes |
| `like_post` | Like a post | Yes |
| `unlike_post` | Unlike a post | Yes |

### Space Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_spaces` | Get all community spaces | Yes |
| `get_space_members` | Get members of a space | Yes |

### Event Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_events` | Get upcoming events | Yes |
| `get_event_details` | Get event details | Yes |
| `rsvp_event` | RSVP to an event | Yes |

### Notification Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_notifications` | Get your notifications | Yes |
| `mark_notification_read` | Mark notification as read | Yes |

### Message Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_direct_messages` | Get your direct messages | Yes |
| `send_direct_message` | Send a direct message | Yes |

### Feed Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_feed` | Get your personalized feed | Yes |

### Comment Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `get_post_comments` | Get comments on a post | Yes |
| `create_comment` | Create a comment | Yes |
| `update_comment` | Update a comment | Yes |
| `delete_comment` | Delete a comment | Yes |

---

## 📚 Usage Examples

### Example 1: Authenticate with Google

**User prompt in Claude Desktop:**
```
Please authenticate with Google so I can access Circle features
```

**What happens:**
1. MCP server receives `authenticate_with_google` tool call
2. OAuth server starts on http://localhost:3000
3. Browser opens for Google sign-in
4. User signs in and authorizes
5. Tokens are exchanged and stored
6. Circle authentication completes

### Example 2: Get Your Profile

**User prompt:**
```
Show me my Circle profile
```

**MCP tool called:**
```json
{
  "name": "get_my_profile",
  "arguments": {}
}
```

**Response:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Community member",
  "member_since": "2024-01-15"
}
```

### Example 3: Get Your Courses

**User prompt:**
```
What courses am I enrolled in?
```

**MCP tool called:**
```json
{
  "name": "get_my_courses",
  "arguments": {}
}
```

### Example 4: Create a Post

**User prompt:**
```
Create a post in the General space with title "Hello World" and body "This is my first post!"
```

**MCP tool called:**
```json
{
  "name": "create_post",
  "arguments": {
    "space_id": "12345",
    "title": "Hello World",
    "body": "This is my first post!"
  }
}
```

### Example 5: Get Events

**User prompt:**
```
Show me upcoming events in the community
```

**MCP tool called:**
```json
{
  "name": "get_events",
  "arguments": {}
}
```

---

## 🐛 Troubleshooting

### Issue: "GCP_CLIENT_ID not configured"

**Solution:**
1. Ensure `.env` file exists in project root
2. Add `GCP_CLIENT_ID` with your actual Google OAuth Client ID
3. Verify the Client ID ends with `.apps.googleusercontent.com`

### Issue: "redirect_uri_mismatch"

**Error Message:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add exactly:
   ```
   http://localhost:3000/auth/google/callback
   ```
5. Click Save
6. Wait 5 minutes for changes to propagate

### Issue: "Port 3000 already in use"

**Solution:**
Change the port in `.env`:
```env
OAUTH_PORT=3001
GCP_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

**Remember:** Update the redirect URI in Google Cloud Console too!

### Issue: "User not found in Circle community"

**Error Message:**
```
Circle authentication failed: User not found
```

**Solution:**
1. Ensure your Google account email is registered in the Circle community
2. Go to your Circle community and check your account email
3. Make sure it matches the Google account you're using to authenticate

### Issue: Browser doesn't open during OAuth

**Solution:**
1. Check the terminal for the OAuth URL
2. Manually copy and paste the URL into your browser
3. Complete the authentication flow

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
npm install
```

### Issue: MCP Server not showing in Claude Desktop

**Solution:**
1. Check `claude_desktop_config.json` syntax (valid JSON)
2. Verify the path to `dist/index.js` is absolute and correct
3. Ensure the server builds successfully (`npm run build`)
4. Restart Claude Desktop completely (quit and relaunch)
5. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

### Issue: OAuth authentication fails silently

**Solution:**
1. Check if you added your email as a test user in GCP OAuth consent screen
2. Verify your GCP project has Google+ API enabled
3. Check server logs for detailed error messages
4. Try the interactive test: `node test-oauth-interactive.js`

---

## 👨‍💻 Development

### Project Structure

```
circle-mcp/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server implementation
│   ├── config/
│   │   └── config.ts            # Configuration management
│   ├── auth/
│   │   ├── gcp-auth.ts          # Google OAuth 2.0
│   │   ├── integrated-auth-manager.ts  # Auth orchestration
│   │   ├── oauth-server.ts      # OAuth callback server
│   │   ├── token-manager.ts     # Token refresh logic
│   │   └── user-storage.ts      # User data persistence
│   ├── api/
│   │   ├── client.ts            # Circle API client
│   │   └── endpoints.ts         # API endpoints
│   ├── tools/
│   │   ├── auth-wrapper.ts      # Authentication wrapper
│   │   ├── profile.ts           # Profile tools
│   │   ├── courses.ts           # Course tools
│   │   ├── posts.ts             # Post tools
│   │   ├── spaces.ts            # Space tools
│   │   ├── events.ts            # Event tools
│   │   ├── notifications.ts     # Notification tools
│   │   ├── messages.ts          # Message tools
│   │   ├── feed.ts              # Feed tools
│   │   └── comments.ts          # Comment tools
│   ├── types/
│   │   └── circle.ts            # TypeScript types
│   └── utils/
│       ├── error-handler.ts     # Error handling
│       ├── logger.ts            # Winston logger
│       └── validators.ts        # Input validation
├── dist/                        # Compiled JavaScript
├── test-oauth-flow.js           # Configuration test
├── test-oauth-automated.js      # Automated tests
├── test-oauth-interactive.js    # Interactive OAuth test
├── verify-setup.js              # Setup verification
├── package.json
├── tsconfig.json
├── .env                         # Environment variables (create this)
└── README.md
```

### Available Scripts

```bash
# Development
npm run build          # Compile TypeScript
npm run typecheck      # Type check without building
npm start              # Start the MCP server
npm run dev            # Development mode with watch

# Testing
node verify-setup.js              # Verify complete setup
node test-oauth-flow.js           # Test OAuth configuration
node test-oauth-automated.js      # Automated server tests
node test-oauth-interactive.js    # Interactive OAuth testing

# Debugging
npx @modelcontextprotocol/inspector node dist/index.js  # MCP Inspector
```

### Adding New Tools

1. Create a new file in `src/tools/your-tool.ts`
2. Import the authentication wrapper:
   ```typescript
   import { withAuthentication } from './auth-wrapper.js';
   ```
3. Define your tool with authentication:
   ```typescript
   export function registerYourTools(
     server: McpServer,
     apiClient: CircleAPIClient,
     authManager: IntegratedAuthManager
   ) {
     server.registerTool(
       'your_tool_name',
       {
         description: 'What your tool does',
         inputSchema: zodToJsonSchema(YourInputSchema)
       },
       withAuthentication(authManager, async (params) => {
         const email = (params as any).authenticatedEmail;
         // Your implementation
       })
     );
   }
   ```
4. Register in `src/server.ts`

### Environment Variables for Development

```env
# Enable debug logging
LOG_LEVEL=debug

# Test with read-only mode
READ_ONLY_MODE=true

# Use different OAuth port
OAUTH_PORT=3001
```

### Running Tests

```bash
# Full test suite
npm run build
node verify-setup.js
node test-oauth-automated.js
node test-oauth-interactive.js
```

### Debugging Tips

1. **Enable debug logging:**
   ```env
   LOG_LEVEL=debug
   ```

2. **Check MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

3. **Monitor server logs:**
   - Logs are output to stderr
   - In Claude Desktop, check log files in the Claude logs directory

4. **Test authentication separately:**
   ```bash
   node test-oauth-interactive.js
   ```

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review server logs for detailed error messages
3. Run `node verify-setup.js` to check configuration
4. Test OAuth flow with `node test-oauth-interactive.js`
5. Check GCP OAuth consent screen configuration
6. Verify your email is added as a test user (if app is in testing mode)

---

## 🎉 Quick Start Summary

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your credentials
cp .env.example .env  # Then edit with your values

# 3. Build the project
npm run build

# 4. Verify setup
node verify-setup.js

# 5. Test OAuth
node test-oauth-interactive.js

# 6. Add to Claude Desktop config
# Edit claude_desktop_config.json (see IDE Integration section)

# 7. Restart Claude Desktop and start chatting!
```

---

**Built with ❤️ using [Model Context Protocol](https://modelcontextprotocol.io/)**
