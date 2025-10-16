# Circle MCP Server - User Guide

## 🚀 Super Simple Setup (One Line Configuration!)

Just copy and paste ONE configuration block. No installation, no cloning, nothing!

---

## 📋 For Claude Desktop Users

1. **Open your Claude Desktop configuration file:**

   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Copy and paste this:**

   ```json
   {
     "mcpServers": {
       "circle": {
         "command": "npx",
         "args": [
           "@modelcontextprotocol/client-websocket",
           "ws://circlemcp.duckdns.org:3000"
         ]
       }
     }
   }
   ```

3. **Restart Claude Desktop** (Quit and reopen)

4. **Done!** Try: "Authenticate with Google to access Circle"

---

## 📋 For Cursor Users

1. **Open Cursor Settings** (Cmd/Ctrl + ,)

2. **Search for "MCP" and add:**

   ```json
   {
     "mcpServers": {
       "circle": {
         "command": "npx",
         "args": [
           "@modelcontextprotocol/client-websocket",
           "ws://circlemcp.duckdns.org:3000"
         ]
       }
     }
   }
   ```

3. **Restart Cursor**

4. **Done!**

---

## ❓ How It Works

```
Your Computer                       Remote Server
┌─────────────┐                    ┌──────────────────┐
│             │                    │                  │
│  Claude/    │   WebSocket    →   │  circlemcp.      │
│  Cursor     │   Connection       │  duckdns.org     │
│             │                    │  :3000           │
│             │   ←  MCP Tools     │                  │
│             │                    │  Circle MCP      │
│             │                    │  Server          │
└─────────────┘                    └──────────────────┘
```

**Key Points:**
- ✅ No `npm install` required - `npx` downloads automatically
- ✅ No code to clone
- ✅ No maintenance needed
- ✅ Just one line of config!
- ✅ WebSocket for real-time communication

---

## 🎯 Example Commands

Once configured, try these in Claude or Cursor:

### Authentication
```
Authenticate with Google to access Circle
```

### Your Profile
```
Show me my Circle profile
Check my authentication status
```

### Courses
```
What courses am I enrolled in?
Show me details for the Python Fundamentals course
```

### Posts
```
Show recent posts from the community
Create a post in General space titled "Hello World" with content "My first post!"
Like the latest post about Python
```

### Events
```
Show upcoming events
Get details for the next community meetup
RSVP to the weekend workshop
```

### More Features
- Get your notifications
- Send direct messages
- View your personalized feed
- Manage comments on posts

---

## 🛠️ Troubleshooting

### Issue: "MCP server not working"

**Solution:**
1. Restart your AI client completely (quit and reopen)
2. Wait 30 seconds for npx to download the client

### Issue: "Cannot connect to server"

**Check server status:**
```bash
curl http://circlemcp.duckdns.org:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "transport": "websocket"
}
```

### Issue: "npx command not found"

**Install Node.js** from https://nodejs.org (version 18 or higher)

### Issue: "Authentication failed"

Make sure:
1. Your Google account email is registered in the Circle community
2. You complete the browser OAuth flow when prompted
3. Your email matches your Circle account email

### Issue: "WebSocket connection failed"

1. Check firewall settings
2. Verify server is running: `curl http://circlemcp.duckdns.org:3000/`
3. Try restarting your AI client

---

## 🔐 Security

- 🔒 WebSocket encryption (use `wss://` for production)
- 🔑 OAuth 2.0 authentication with Google
- 🚫 No passwords stored
- ✅ Tokens managed securely on server
- 🛡️ Read-only mode available

---

## 📊 Available Features (20+ Tools)

### Authentication
✅ Google OAuth login
✅ Check auth status
✅ Logout

### Profile Management
✅ View your profile
✅ Update profile information

### Courses
✅ List your enrolled courses
✅ Get course details
✅ Access course content

### Posts & Content
✅ Browse community posts
✅ Create new posts
✅ Update/delete your posts
✅ Like and unlike posts

### Comments
✅ Read comments
✅ Add comments
✅ Edit/delete your comments

### Events
✅ View upcoming events
✅ Get event details
✅ RSVP to events

### Communication
✅ Check notifications
✅ Mark notifications as read
✅ Send direct messages
✅ Read your messages

### Community
✅ Browse spaces
✅ View space members
✅ Get personalized feed

---

## 📞 Server Information

**Server Status:** http://circlemcp.duckdns.org:3000/health
**API Info:** http://circlemcp.duckdns.org:3000/api/mcp/info
**WebSocket URL:** ws://circlemcp.duckdns.org:3000
**GitHub:** https://github.com/DeepakChander/circle-mcp

---

## 🎉 That's It!

**Just one line of configuration and you're ready!**

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/client-websocket",
        "ws://circlemcp.duckdns.org:3000"
      ]
    }
  }
}
```

No cloning. No building. No maintenance. Just paste and use!

---

## 🔧 For Developers

If you want to run your own instance:

```bash
# Clone the repository
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp

# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
nano .env

# Build the project
npm run build

# Run with Docker
docker-compose up -d

# Or run directly
npm run start:http
```

The server will start on port 3000 with WebSocket support.

---

**Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io/)**
