# Circle MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.19-green.svg)](https://modelcontextprotocol.io/)
[![OAuth 2.1](https://img.shields.io/badge/OAuth-2.1-orange.svg)](https://oauth.net/2.1/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Zero-config MCP server for Circle LMS communities.** Paste one URL into any IDE, authenticate via Google, and get 20+ Circle community tools — no API keys, no scripts, no tokens.

```json
{
  "mcpServers": {
    "circle": {
      "url": "https://your-domain.com/mcp"
    }
  }
}
```

That's it. Auth happens in-browser after first tool use.

---

## How It Works

1. **User pastes MCP URL** into their IDE (Cursor, Claude Code, VS Code, Windsurf, Claude Desktop)
2. **First tool use** triggers browser-based Google OAuth
3. **Server checks** if the Google email is a registered member of the Circle community
4. **If yes** — 20+ tools become available (profile, courses, posts, events, etc.)
5. **If no** — access denied ("Email not registered in this community")
6. **Token auto-refreshes** — no re-authentication needed for 30 days

---

## Quick Start (For Organization Admins)

### 1. Clone & Install

```bash
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp
npm install
```

### 2. Set Up Google Cloud OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Create a project
2. **APIs & Services** → **Library** → Enable **Google+ API**
3. **APIs & Services** → **OAuth consent screen** → Configure (External, add test users)
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/callback`
5. Copy the **Client ID** and **Client Secret**

### 3. Get Circle Credentials

1. Log into your Circle community admin panel
2. **Settings** → **API** → Generate a **Headless Access Token**
3. **Settings** → **API** → Get your **Admin V2 Token**
4. Note your community URL (e.g., `https://community.yourorg.com`)

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Circle LMS (Required)
CIRCLE_HEADLESS_TOKEN=your_circle_headless_token
CIRCLE_ADMIN_V2_TOKEN=your_circle_admin_v2_token
CIRCLE_COMMUNITY_URL=https://your-community.circle.so
CIRCLE_HEADLESS_BASE_URL=https://app.circle.so

# Google OAuth (Required)
GCP_CLIENT_ID=your-client-id.apps.googleusercontent.com
GCP_CLIENT_SECRET=GOCSPX-your-secret
GCP_REDIRECT_URI=http://localhost:3000/callback

# Server
SERVER_URL=http://localhost:3000
PORT=3000
```

### 5. Build & Run

```bash
npm run build
npm run start:http
```

### 6. Verify

```bash
# Health check
curl http://localhost:3000/health

# OAuth metadata (should return JSON)
curl http://localhost:3000/.well-known/oauth-authorization-server

# Should return 401 (no auth token — this is correct)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
```

---

## IDE Setup (For Students/Users)

Your organization admin gives you a URL (e.g., `https://circle.10x.in/mcp`). Here's how to use it:

### Cursor

Create `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "circle": {
      "url": "https://circle.10x.in/mcp"
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add circle --transport http https://circle.10x.in/mcp
```

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "circle": {
      "type": "http",
      "url": "https://circle.10x.in/mcp"
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "circle": {
      "url": "https://circle.10x.in/mcp"
    }
  }
}
```

### Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://circle.10x.in/mcp"]
    }
  }
}
```

> **Note:** Replace `https://circle.10x.in/mcp` with your organization's actual MCP URL.

---

## Available Tools

### Profile
| Tool | Description |
|------|-------------|
| `get_my_profile` | Get your Circle profile details |
| `update_my_profile` | Update name, bio, headline, location, website |

### Courses
| Tool | Description |
|------|-------------|
| `get_my_courses` | List courses you're enrolled in |
| `get_course_details` | Get detailed info about a specific course |

### Posts
| Tool | Description |
|------|-------------|
| `get_posts` | List posts from a space or all spaces |
| `create_post` | Create a new post in a space |
| `update_post` | Edit your own post |
| `delete_post` | Delete your own post |
| `like_post` | Like or unlike a post |

### Spaces
| Tool | Description |
|------|-------------|
| `get_spaces` | List all community spaces |

### Events
| Tool | Description |
|------|-------------|
| `get_events` | List upcoming events |
| `rsvp_event` | Register for an event |

### Comments
| Tool | Description |
|------|-------------|
| `get_comments` | Get comments on a post |
| `add_comment` | Comment on a post |
| `delete_comment` | Delete your own comment |
| `like_comment` | Like or unlike a comment |

### Feed & Notifications
| Tool | Description |
|------|-------------|
| `get_feed` | Get your personalized home feed |
| `get_notifications` | Get your notifications |
| `get_messages` | Get your direct messages |

---

## Architecture

```
IDE (Cursor / Claude Code / VS Code / Windsurf)
    |
    |  POST https://circle.10x.in/mcp
    |  Authorization: Bearer <mcp_token>
    |
    v
+---------------------------------------------------+
|  Express HTTP Server (src/http-server.ts)          |
|                                                    |
|  OAuth 2.1 Endpoints:                              |
|  GET  /.well-known/oauth-protected-resource        |
|  GET  /.well-known/oauth-authorization-server      |
|  POST /register  (Dynamic Client Registration)     |
|  GET  /authorize (redirects to Google)             |
|  GET  /callback  (Google -> Circle auth -> token)  |
|  POST /token     (code exchange + refresh)         |
|                                                    |
|  MCP Endpoints (Streamable HTTP):                  |
|  POST   /mcp  (JSON-RPC tool calls)               |
|  GET    /mcp  (SSE notifications)                  |
|  DELETE /mcp  (session termination)                |
+-------------------------+--------------------------+
                          |
                          v
+---------------------------------------------------+
|  Per-Session McpServer (src/server.ts)             |
|  - Created per authenticated user                  |
|  - 20+ tools with email pre-injected              |
|  - Prompts + Resources                             |
+-------------------------+--------------------------+
                          |
                          v
+---------------------------------------------------+
|  Circle API Client (src/api/client.ts)             |
|  - Headless API authentication                     |
|  - Rate limiting + retry logic                     |
+---------------------------------------------------+
```

### OAuth Flow (First-Time Authentication)

```
1. IDE sends POST /mcp (no token)
2. Server returns 401 + WWW-Authenticate header
3. IDE discovers OAuth metadata via .well-known endpoints
4. IDE registers as OAuth client (POST /register)
5. IDE opens browser to /authorize with PKCE challenge
6. Server redirects to Google OAuth
7. User signs in with Google
8. Google redirects back to /callback with auth code
9. Server exchanges Google code for email
10. Server verifies email exists in Circle community
11. Server generates MCP authorization code
12. IDE exchanges code for MCP access token (POST /token)
13. IDE sends POST /mcp with Bearer token — tools work!
```

---

## Production Deployment

### Environment Changes

| Setting | Localhost | Production |
|---------|-----------|------------|
| `SERVER_URL` | `http://localhost:3000` | `https://circle.10x.in` |
| `GCP_REDIRECT_URI` | `http://localhost:3000/callback` | `https://circle.10x.in/callback` |
| `NODE_ENV` | `development` | `production` |
| `ALLOWED_ORIGINS` | `*` | `https://circle.10x.in` |

### GCP Console

Add `https://circle.10x.in/callback` as an authorized redirect URI in your GCP OAuth credentials.

### Nginx + SSL

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d circle.10x.in
```

Nginx config (`/etc/nginx/sites-available/circle-mcp`):

```nginx
server {
    listen 80;
    server_name circle.10x.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name circle.10x.in;

    ssl_certificate /etc/letsencrypt/live/circle.10x.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/circle.10x.in/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

### Run with PM2

```bash
npm run build
pm2 start dist/http-server.js --name circle-mcp
pm2 save
```

### Docker

```bash
docker build -t circle-mcp .
docker run -d --env-file .env -p 3000:3000 --name circle-mcp circle-mcp
```

---

## Multi-Organization Support

This is open-source. Each organization deploys their own instance with their own credentials. Deployments are completely independent.

**Example:** AcademyX wants to use this for their Circle community.

1. Clone this repo and configure `.env` with AcademyX Circle + GCP credentials
2. Deploy and point `mcp.academyx.com` to the server
3. Give students: `{"mcpServers": {"circle": {"url": "https://mcp.academyx.com/mcp"}}}`

Only AcademyX students (emails in their Circle LMS) can authenticate. Other organizations' students cannot access it.

---

## Project Structure

```
circle-mcp/
├── src/
│   ├── index.ts                      # Stdio entry point (local dev)
│   ├── http-server.ts                # HTTP server entry point (production)
│   ├── server.ts                     # MCP server factory + stdio class
│   ├── auth/
│   │   ├── mcp-oauth-server.ts       # OAuth 2.1 Authorization Server
│   │   ├── session-manager.ts        # Token-to-email + session tracking
│   │   ├── gcp-auth.ts               # Google OAuth 2.0 client
│   │   ├── auth.ts                   # Circle headless authentication
│   │   ├── integrated-auth-manager.ts # Auth orchestration (stdio mode)
│   │   ├── token-manager.ts          # In-memory token storage
│   │   └── types.ts                  # Auth type definitions
│   ├── api/
│   │   ├── client.ts                 # Circle API client (rate limiting, retry)
│   │   └── endpoints.ts              # Circle API URL builders
│   ├── tools/
│   │   ├── index.ts                  # Tool registration (stdio + session)
│   │   ├── auth-wrapper.ts           # withAuthentication + withSessionAuth
│   │   ├── profile.ts                # Profile tools
│   │   ├── courses.ts                # Course tools
│   │   ├── posts.ts                  # Post tools
│   │   ├── spaces.ts                 # Space tools
│   │   ├── events.ts                 # Event tools
│   │   ├── notifications.ts          # Notification tools
│   │   ├── messages.ts               # Message tools
│   │   ├── feed.ts                   # Feed tools
│   │   └── comments.ts              # Comment tools
│   ├── config/
│   │   ├── config.ts                 # Environment config loader
│   │   └── constants.ts              # App constants
│   ├── types/
│   │   ├── mcp.ts                    # MCP + config types
│   │   ├── circle.ts                 # Circle API types
│   │   └── index.ts                  # Type re-exports
│   ├── prompts/
│   │   └── index.ts                  # MCP prompts
│   ├── resources/
│   │   └── index.ts                  # MCP resources
│   └── utils/
│       ├── logger.ts                 # Winston logger
│       ├── errors.ts                 # Error utilities
│       ├── response-handler.ts       # Response formatting
│       └── validators.ts            # Input validation
├── .env.example                      # Environment template
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── ecosystem.config.js               # PM2 config
```

---

## Scripts

```bash
npm run build        # Compile TypeScript
npm run start        # Start stdio server (local dev with Claude Desktop)
npm run start:http   # Start HTTP server (production, remote IDEs)
npm run dev          # Dev mode with watch (stdio)
npm run dev:http     # Dev mode with watch (HTTP)
npm run typecheck    # Type check without emitting
npm run test         # Run tests
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CIRCLE_HEADLESS_TOKEN` | Yes | — | Circle API headless token |
| `CIRCLE_ADMIN_V2_TOKEN` | Yes | — | Circle Admin API v2 token |
| `CIRCLE_COMMUNITY_URL` | Yes | — | Your Circle community URL |
| `CIRCLE_HEADLESS_BASE_URL` | No | `https://app.circle.so` | Circle API base URL |
| `GCP_CLIENT_ID` | Yes | — | Google OAuth Client ID |
| `GCP_CLIENT_SECRET` | Yes | — | Google OAuth Client Secret |
| `GCP_REDIRECT_URI` | Yes | `http://localhost:3000/callback` | OAuth redirect URI |
| `SERVER_URL` | No | `http://localhost:3000` | Public server URL |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | `info` | Logging level |
| `MCP_TOKEN_EXPIRY` | No | `3600` | Access token TTL (seconds) |
| `MCP_REFRESH_TOKEN_EXPIRY` | No | `2592000` | Refresh token TTL (30 days) |
| `READ_ONLY_MODE` | No | `false` | Disable write operations |
| `ENABLE_RATE_LIMITING` | No | `true` | Rate limit API calls |
| `MAX_REQUESTS_PER_MINUTE` | No | `60` | Rate limit threshold |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |

---

## Security

| Feature | Implementation |
|---------|---------------|
| **PKCE (S256)** | Mandatory on all OAuth flows. Prevents authorization code interception. |
| **State parameter** | Passed through Google redirect. Prevents CSRF. |
| **Opaque tokens** | UUIDs, not JWTs. Server-side lookup. Instantly revocable. |
| **Token expiry** | Access: 1 hour. Refresh: 30 days. Auth codes: 10 minutes. |
| **Token rotation** | Refresh grants issue new refresh token, old one is deleted. |
| **Membership check** | Email must exist in the Circle community. Non-members are rejected. |
| **HTTPS** | Required in production (Nginx + Let's Encrypt). |
| **In-memory storage** | Tokens are lost on restart. Users re-auth seamlessly via Google session. |
| **Periodic cleanup** | Expired tokens, codes, and stale registrations purged every 5 minutes. |

---

## Troubleshooting

### `redirect_uri_mismatch` from Google

Your GCP OAuth redirect URI doesn't match. In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth client, add exactly:
- Localhost: `http://localhost:3000/callback`
- Production: `https://your-domain.com/callback`

### "Email not registered in this community"

The Google account email isn't a member of the Circle community. The user needs to be added to Circle first.

### Port 3000 already in use

Change `PORT` in `.env` and update `GCP_REDIRECT_URI` accordingly.

### MCP not connecting in IDE

1. Verify the server is running: `curl http://localhost:3000/health`
2. Check OAuth metadata: `curl http://localhost:3000/.well-known/oauth-authorization-server`
3. Ensure the URL in your IDE config ends with `/mcp`

### TypeScript build errors

```bash
rm -rf dist node_modules
npm install
npm run build
```

---

## License

MIT

---

Built with [Model Context Protocol](https://modelcontextprotocol.io/) and [Circle API](https://api.circle.so/)
