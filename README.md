# Circle MCP Server — The Complete MCP Server for Circle Communities

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.19-green.svg)](https://modelcontextprotocol.io/)
[![OAuth 2.1](https://img.shields.io/badge/OAuth-2.1-orange.svg)](https://oauth.net/2.1/)
[![Tools](https://img.shields.io/badge/Tools-97-purple.svg)](#all-97-tools)
[![Admin V2 API](https://img.shields.io/badge/Admin_V2_API-78_tools-red.svg)](#admin-v2-api-tools-78-tools)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **The most comprehensive [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for [Circle](https://circle.so) communities.** 97 tools covering members, spaces, posts, comments, events, courses, access groups, tags, gamification, and full Admin V2 API — all accessible from Cursor, Claude Code, VS Code, Windsurf, and Claude Desktop.

## Why Circle MCP?

| Feature | Circle MCP Server |
|---------|:-:|
| Total tools | **97** |
| Circle Admin V2 API coverage | **78 tools** |
| Member API (per-user) | **19 tools** |
| OAuth 2.1 + PKCE | Yes |
| Streamable HTTP transport | Yes |
| Read-only safety mode | Yes |
| Works with Cursor, Claude Code, VS Code, Windsurf, Claude Desktop | Yes |
| Zero-config for end users | Yes |
| Docker + PM2 ready | Yes |

---

## Zero-Config Setup for End Users

Your organization admin gives you one URL. Paste it into your IDE and start using Circle community tools:

```json
{
  "mcpServers": {
    "circle": {
      "url": "https://your-domain.com/mcp"
    }
  }
}
```

That's it. Authentication happens in-browser via Google OAuth after first tool use.

---

## How It Works

1. **User pastes MCP URL** into their IDE (Cursor, Claude Code, VS Code, Windsurf, Claude Desktop)
2. **First tool use** triggers browser-based Google OAuth with PKCE
3. **Server checks** if the Google email is a registered member of the Circle community
4. **If yes** — 97 tools become available (profile, courses, posts, events, admin, etc.)
5. **If no** — access denied ("Email not registered in this community")
6. **Tokens auto-refresh** — no re-authentication needed for 30 days

---

## Quick Start (For Organization Admins)

### 1. Clone & Install

```bash
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp
npm install
```

### 2. Set Up Google Cloud OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) — Create a project
2. **APIs & Services** > **Library** > Enable **Google+ API**
3. **APIs & Services** > **OAuth consent screen** > Configure (External, add test users)
4. **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - Type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/callback`
5. Copy the **Client ID** and **Client Secret**

### 3. Get Circle API Credentials

1. Log into your Circle community admin panel
2. **Settings** > **API** > Generate a **Headless Access Token**
3. **Settings** > **API** > Get your **Admin V2 Token** (required for 78 admin tools)
4. Note your community URL (e.g., `https://community.yourorg.com`)

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

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

# OAuth metadata
curl http://localhost:3000/.well-known/oauth-authorization-server
```

---

## IDE Setup

### Cursor

Create `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "circle": {
      "url": "https://your-domain.com/mcp"
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add circle --transport http https://your-domain.com/mcp
```

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "circle": {
      "type": "http",
      "url": "https://your-domain.com/mcp"
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
      "url": "https://your-domain.com/mcp"
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
      "args": ["-y", "mcp-remote", "https://your-domain.com/mcp"]
    }
  }
}
```

---

## All 97 Tools

Circle MCP Server provides **97 tools** across two API layers:

- **Member API (19 tools)** — Per-user tools authenticated via Google OAuth. Each user can only access their own data.
- **Admin V2 API (78 tools)** — Full admin capabilities using the Circle Admin V2 token. Manage members, spaces, posts, events, courses, access groups, tags, and community settings.

---

### Member API Tools (19 tools)

These tools operate on behalf of the authenticated user.

#### Profile (2 tools)
| Tool | Description |
|------|-------------|
| `get_my_profile` | Get your Circle profile details |
| `update_my_profile` | Update name, bio, headline, location, website |

#### Courses (2 tools)
| Tool | Description |
|------|-------------|
| `get_my_courses` | List courses you're enrolled in |
| `get_course_details` | Get detailed info about a specific course |

#### Posts (5 tools)
| Tool | Description |
|------|-------------|
| `get_posts` | List posts from a space or all spaces |
| `create_post` | Create a new post in a space |
| `update_post` | Edit your own post |
| `delete_post` | Delete your own post |
| `like_post` | Like or unlike a post |

#### Spaces (1 tool)
| Tool | Description |
|------|-------------|
| `get_spaces` | List all community spaces |

#### Events (2 tools)
| Tool | Description |
|------|-------------|
| `get_events` | List upcoming events |
| `rsvp_event` | Register for an event |

#### Comments (4 tools)
| Tool | Description |
|------|-------------|
| `get_comments` | Get comments on a post |
| `add_comment` | Comment on a post |
| `delete_comment` | Delete your own comment |
| `like_comment` | Like or unlike a comment |

#### Feed & Notifications (3 tools)
| Tool | Description |
|------|-------------|
| `get_feed` | Get your personalized home feed |
| `get_notifications` | Get your notifications |
| `get_messages` | Get your direct messages |

---

### Admin V2 API Tools (78 tools)

Full admin capabilities via the Circle Admin V2 API. Requires `CIRCLE_ADMIN_V2_TOKEN` in your `.env`. Destructive operations (create, update, delete) are disabled when `READ_ONLY_MODE=true`.

#### Member Management (7 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_list_members` | Read | List all community members with pagination |
| `admin_get_member` | Read | Get a specific member by ID |
| `admin_search_members` | Read | Search members by email, name, or query |
| `admin_invite_member` | Write | Invite a new member by email |
| `admin_update_member` | Write | Update member profile, admin/moderator status |
| `admin_ban_member` | Write | Ban a community member |
| `admin_remove_member` | Write | Remove a member from the community |

#### Space Management (13 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_list_spaces` | Read | List all community spaces |
| `admin_get_space` | Read | Get a specific space by ID |
| `admin_list_space_groups` | Read | List all space groups |
| `admin_get_space_group` | Read | Get a specific space group |
| `admin_list_space_members` | Read | List members of a space |
| `admin_create_space` | Write | Create a new space |
| `admin_update_space` | Write | Update space settings |
| `admin_delete_space` | Write | Delete a space |
| `admin_create_space_group` | Write | Create a new space group |
| `admin_update_space_group` | Write | Update a space group |
| `admin_delete_space_group` | Write | Delete a space group |
| `admin_add_space_member` | Write | Add a member to a space |
| `admin_remove_space_member` | Write | Remove a member from a space |

#### Content Management (15 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_list_posts` | Read | List posts with optional space/status filter |
| `admin_get_post` | Read | Get a specific post by ID |
| `admin_list_comments` | Read | List comments filtered by post |
| `admin_get_comment` | Read | Get a specific comment by ID |
| `admin_list_topics` | Read | List topics filtered by space |
| `admin_list_all_comments` | Read | List all comments across the community |
| `admin_create_post` | Write | Create a new post in a space |
| `admin_update_post` | Write | Update an existing post |
| `admin_delete_post` | Write | Delete a post |
| `admin_create_comment` | Write | Create a comment on a post |
| `admin_update_comment` | Write | Update a comment |
| `admin_delete_comment` | Write | Delete a comment |
| `admin_create_topic` | Write | Create a new topic |
| `admin_update_topic` | Write | Update a topic |
| `admin_delete_topic` | Write | Delete a topic |

#### Event Management (8 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_list_events` | Read | List events with space/status filter |
| `admin_get_event` | Read | Get a specific event by ID |
| `admin_list_event_attendees` | Read | List attendees of an event |
| `admin_create_event` | Write | Create a new event (virtual, in-person, hybrid) |
| `admin_update_event` | Write | Update event details |
| `admin_delete_event` | Write | Delete an event |
| `admin_add_event_attendee` | Write | Add a member as an attendee |
| `admin_remove_event_attendee` | Write | Remove an attendee from an event |

#### Course Management (11 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_list_courses` | Read | List all courses in the community |
| `admin_get_course` | Read | Get a specific course by ID |
| `admin_list_course_sections` | Read | List sections of a course |
| `admin_list_course_lessons` | Read | List lessons in a course section |
| `admin_create_course_section` | Write | Create a new course section |
| `admin_update_course_section` | Write | Update a course section |
| `admin_delete_course_section` | Write | Delete a course section |
| `admin_create_course_lesson` | Write | Create a new lesson |
| `admin_update_course_lesson` | Write | Update a lesson |
| `admin_delete_course_lesson` | Write | Delete a lesson |
| `admin_complete_lesson` | Write | Mark a lesson complete for a member |

#### Access Group Management (9 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_list_access_groups` | Read | List all access groups |
| `admin_get_access_group` | Read | Get a specific access group |
| `admin_list_access_group_members` | Read | List members in an access group |
| `admin_create_access_group` | Write | Create a new access group |
| `admin_update_access_group` | Write | Update an access group |
| `admin_archive_access_group` | Write | Archive an access group |
| `admin_unarchive_access_group` | Write | Unarchive an access group |
| `admin_add_access_group_member` | Write | Add a member to an access group |
| `admin_remove_access_group_member` | Write | Remove a member from an access group |

#### Engagement & Tags (9 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_get_leaderboard` | Read | Get the gamification leaderboard |
| `admin_list_member_tags` | Read | List all member tags |
| `admin_list_member_tags_for_member` | Read | List tags assigned to a member |
| `admin_search_members_by_email` | Read | Find members by email address |
| `admin_create_member_tag` | Write | Create a new member tag |
| `admin_update_member_tag` | Write | Update a member tag |
| `admin_delete_member_tag` | Write | Delete a member tag |
| `admin_tag_member` | Write | Assign a tag to a member |
| `admin_send_member_message` | Write | Send a direct message to a member |

#### Community Settings (6 tools)
| Tool | Type | Description |
|------|:----:|-------------|
| `admin_get_community` | Read | Get community information and settings |
| `admin_list_profile_fields` | Read | List custom profile fields |
| `admin_list_all_topics` | Read | List all topics across the community |
| `admin_list_all_course_sections` | Read | List all course sections |
| `admin_list_all_course_lessons` | Read | List all course lessons |
| `admin_update_community` | Write | Update community name and description |

---

## Architecture

```
IDE (Cursor / Claude Code / VS Code / Windsurf / Claude Desktop)
    |
    |  POST /mcp  (Streamable HTTP + JSON-RPC)
    |  Authorization: Bearer <mcp_token>
    |
    v
+---------------------------------------------------+
|  Express HTTP Server                               |
|                                                    |
|  OAuth 2.1 Endpoints:                              |
|  GET  /.well-known/oauth-protected-resource        |
|  GET  /.well-known/oauth-authorization-server      |
|  POST /register  (Dynamic Client Registration)     |
|  GET  /authorize (redirects to Google OAuth)       |
|  GET  /callback  (Google -> Circle auth -> token)  |
|  POST /token     (code exchange + refresh)         |
|                                                    |
|  MCP Endpoints (Streamable HTTP):                  |
|  POST   /mcp  (JSON-RPC tool calls)               |
|  GET    /mcp  (SSE notifications)                  |
|  DELETE /mcp  (session termination)                |
+-------------------------+-------------------------+
                          |
            +-------------+-------------+
            |                           |
            v                           v
+------------------------+  +------------------------+
|  Circle Headless API   |  |  Circle Admin V2 API   |
|  (Per-User, 19 tools)  |  |  (Admin, 78 tools)     |
|  /api/v1/              |  |  /api/admin/v2/        |
+------------------------+  +------------------------+
```

### OAuth Flow

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
13. IDE sends POST /mcp with Bearer token — 97 tools available!
```

---

## Production Deployment

### Environment Changes

| Setting | Localhost | Production |
|---------|-----------|------------|
| `SERVER_URL` | `http://localhost:3000` | `https://your-domain.com` |
| `GCP_REDIRECT_URI` | `http://localhost:3000/callback` | `https://your-domain.com/callback` |
| `NODE_ENV` | `development` | `production` |
| `ALLOWED_ORIGINS` | `*` | `https://your-domain.com` |

### Nginx + SSL

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

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

This is open-source. Each organization deploys their own instance with their own Circle + Google OAuth credentials. Deployments are completely independent.

**Example:** AcademyX wants Circle MCP for their community.

1. Clone this repo and configure `.env` with AcademyX's Circle + GCP credentials
2. Deploy and point `mcp.academyx.com` to the server
3. Give students: `{"mcpServers": {"circle": {"url": "https://mcp.academyx.com/mcp"}}}`

Only AcademyX members (emails registered in their Circle community) can authenticate.

---

## Security

| Feature | Implementation |
|---------|---------------|
| **PKCE (S256)** | Mandatory on all OAuth flows. Prevents authorization code interception. |
| **State parameter** | Passed through Google redirect. Prevents CSRF. |
| **Opaque tokens** | UUIDs, not JWTs. Server-side lookup. Instantly revocable. |
| **Token expiry** | Access: 1 hour. Refresh: 30 days. Auth codes: 10 minutes. |
| **Token rotation** | Refresh grants issue new refresh token; old one is deleted. |
| **Membership check** | Email must exist in the Circle community. Non-members are rejected. |
| **Read-only mode** | Set `READ_ONLY_MODE=true` to disable all write/delete operations. |
| **Admin V2 isolation** | Admin tools only registered when `CIRCLE_ADMIN_V2_TOKEN` is configured. |
| **HTTPS** | Required in production (Nginx + Let's Encrypt). |
| **Periodic cleanup** | Expired tokens, codes, and stale registrations purged every 5 minutes. |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `CIRCLE_HEADLESS_TOKEN` | Yes | — | Circle API headless token (member API) |
| `CIRCLE_ADMIN_V2_TOKEN` | No | — | Circle Admin V2 API token (enables 78 admin tools) |
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
| `READ_ONLY_MODE` | No | `false` | Disable all write operations |
| `MCP_TOKEN_EXPIRY` | No | `3600` | Access token TTL (seconds) |
| `MCP_REFRESH_TOKEN_EXPIRY` | No | `2592000` | Refresh token TTL (30 days) |
| `ENABLE_RATE_LIMITING` | No | `true` | Rate limit API calls |
| `MAX_REQUESTS_PER_MINUTE` | No | `60` | Rate limit threshold |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |

---

## Project Structure

```
circle-mcp/
├── src/
│   ├── index.ts                      # Stdio entry point
│   ├── http-server.ts                # HTTP server entry point (production)
│   ├── server.ts                     # MCP server factory
│   ├── auth/
│   │   ├── mcp-oauth-server.ts       # OAuth 2.1 Authorization Server
│   │   ├── session-manager.ts        # Token-to-email + session tracking
│   │   ├── gcp-auth.ts               # Google OAuth 2.0 client
│   │   ├── auth.ts                   # Circle headless authentication
│   │   ├── integrated-auth-manager.ts
│   │   ├── token-manager.ts          # In-memory token storage
│   │   └── types.ts
│   ├── api/
│   │   ├── client.ts                 # Circle Headless API client
│   │   ├── admin-v2-client.ts        # Circle Admin V2 API client
│   │   └── endpoints.ts              # API URL builders
│   ├── tools/
│   │   ├── index.ts                  # Tool registration hub
│   │   ├── auth-wrapper.ts           # Auth wrappers
│   │   ├── profile.ts                # Member: Profile (2 tools)
│   │   ├── courses.ts                # Member: Courses (2 tools)
│   │   ├── posts.ts                  # Member: Posts (5 tools)
│   │   ├── spaces.ts                 # Member: Spaces (1 tool)
│   │   ├── events.ts                 # Member: Events (2 tools)
│   │   ├── notifications.ts          # Member: Notifications (1 tool)
│   │   ├── messages.ts               # Member: Messages (1 tool)
│   │   ├── feed.ts                   # Member: Feed (1 tool)
│   │   ├── comments.ts               # Member: Comments (4 tools)
│   │   ├── admin-members.ts          # Admin: Members (7 tools)
│   │   ├── admin-spaces.ts           # Admin: Spaces (13 tools)
│   │   ├── admin-content.ts          # Admin: Content (15 tools)
│   │   ├── admin-events.ts           # Admin: Events (8 tools)
│   │   ├── admin-courses.ts          # Admin: Courses (11 tools)
│   │   ├── admin-access.ts           # Admin: Access Groups (9 tools)
│   │   ├── admin-engagement.ts       # Admin: Engagement (9 tools)
│   │   └── admin-community.ts        # Admin: Community (6 tools)
│   ├── config/
│   │   ├── config.ts                 # Environment config loader
│   │   └── constants.ts              # API endpoint constants
│   ├── types/
│   │   ├── mcp.ts                    # MCP types
│   │   ├── circle.ts                 # Circle API types
│   │   └── index.ts
│   ├── prompts/
│   │   └── index.ts
│   ├── resources/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts                 # Winston logger
│       ├── errors.ts
│       ├── response-handler.ts
│       └── validators.ts
├── .env.example
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
npm run start        # Start stdio server (local dev)
npm run start:http   # Start HTTP server (production)
npm run dev          # Dev mode with watch (stdio)
npm run dev:http     # Dev mode with watch (HTTP)
npm run typecheck    # Type check without emitting
npm run test         # Run tests
```

---

## Troubleshooting

### `redirect_uri_mismatch` from Google

Your GCP OAuth redirect URI doesn't match. In [Google Cloud Console](https://console.cloud.google.com/) > Credentials > your OAuth client, add exactly:
- Localhost: `http://localhost:3000/callback`
- Production: `https://your-domain.com/callback`

### "Email not registered in this community"

The Google account email isn't a member of the Circle community. The user must be added to Circle first.

### Admin tools not appearing

Make sure `CIRCLE_ADMIN_V2_TOKEN` is set in your `.env`. Admin V2 tools are only registered when the token is configured.

### Port 3000 already in use

Change `PORT` in `.env` and update `GCP_REDIRECT_URI` accordingly.

### MCP not connecting in IDE

1. Verify the server is running: `curl http://localhost:3000/health`
2. Check OAuth metadata: `curl http://localhost:3000/.well-known/oauth-authorization-server`
3. Ensure the URL in your IDE config ends with `/mcp`

---

## Contributing

Contributions are welcome! Please open an issue or pull request.

---

## License

MIT

---

Built with [Model Context Protocol](https://modelcontextprotocol.io/) and [Circle API](https://api.circle.so/)
