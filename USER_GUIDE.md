# Circle MCP Server - User Guide

## 🚀 Quick Start (For End Users)

You **DON'T** need to clone or install anything! Just copy and paste the configuration below.

---

## 📋 Step-by-Step Instructions

### For Claude Desktop Users

1. **Locate your Claude Desktop configuration file:**

   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Open the file** in a text editor (Notepad, VS Code, etc.)

3. **Copy and paste this configuration:**

   ```json
   {
     "mcpServers": {
       "circle": {
         "command": "npx",
         "args": ["-y", "circle-mcp-client"],
         "env": {
           "CIRCLE_MCP_SERVER_URL": "http://54.152.106.177:3001"
         }
       }
     }
   }
   ```

4. **Save the file**

5. **Restart Claude Desktop completely** (Quit and reopen)

6. **Done!** Start chatting with Claude and use Circle features:
   - "Authenticate with Google to access Circle"
   - "Show me my Circle profile"
   - "Get my courses"
   - "Create a post in the General space"

---

### For Cursor Users

1. **Open Cursor Settings** (Cmd/Ctrl + ,)

2. **Search for "MCP"**

3. **Add this configuration to MCP settings:**

   ```json
   {
     "mcpServers": {
       "circle": {
         "command": "npx",
         "args": ["-y", "circle-mcp-client"],
         "env": {
           "CIRCLE_MCP_SERVER_URL": "http://54.152.106.177:3001"
         }
       }
     }
   }
   ```

4. **Restart Cursor**

5. **Done!** Use Circle features in your conversations

---

### For Other MCP Clients

Use the same configuration format with your MCP client:

```json
{
  "command": "npx",
  "args": ["-y", "circle-mcp-client"],
  "env": {
    "CIRCLE_MCP_SERVER_URL": "http://54.152.106.177:3001"
  }
}
```

---

## ❓ How It Works

```
Your Computer                    Remote Server (AWS)
┌─────────────┐                 ┌──────────────────┐
│             │                 │                  │
│  Claude     │   ← stdio →    │  circle-mcp-     │   ← SSE →   │  Circle MCP  │
│  Desktop    │                 │  client (npx)    │             │  Server      │
│             │                 │                  │             │              │
└─────────────┘                 └──────────────────┘             └──────────────┘
```

- **No installation needed** - `npx` downloads the client automatically
- **No code to maintain** - You just use the remote server
- **Always up-to-date** - Server admin keeps it updated

---

## 🎯 Example Commands

Once configured, try these commands in Claude:

### Authentication
```
Authenticate with Google to access Circle
```

### Profile
```
Show me my Circle profile
Check my authentication status
```

### Courses
```
What courses am I enrolled in?
Show details for the [Course Name] course
```

### Posts
```
Show me recent posts from the community
Create a post in General space with title "Hello" and content "My first post"
Like the post about [topic]
```

### Events
```
Show me upcoming events
RSVP to the [Event Name] event
```

### Notifications
```
Show my notifications
Mark notification [ID] as read
```

---

## 🛠️ Troubleshooting

### Issue: "Circle MCP not found"

**Solution:** Restart your AI client completely (quit and reopen)

### Issue: "Cannot connect to server"

**Solution:**
1. Check server status: http://54.152.106.177:3001/health
2. If server is down, contact the administrator

### Issue: "npx command not found"

**Solution:** Install Node.js from https://nodejs.org (version 18 or higher)

### Issue: "Authentication failed"

**Solution:**
1. Make sure you're using a Google account
2. Ensure your email is registered in the Circle community
3. Complete the browser authentication flow

---

## 🔐 Security & Privacy

- **Your data is secure** - All communication uses HTTPS (when configured)
- **OAuth authentication** - You authenticate directly with Google
- **No password storage** - Tokens are managed securely
- **Read-only by default** - Optional write permissions require authorization

---

## 📊 Available Tools

The Circle MCP server provides 20+ tools:

**Authentication**
- Authenticate with Google
- Check authentication status
- Logout

**Profile Management**
- Get your profile
- Update your profile

**Courses**
- Get your enrolled courses
- Get course details

**Posts**
- Get posts from community
- Create, update, delete posts
- Like/unlike posts

**Spaces**
- Get all spaces
- Get space members

**Events**
- Get upcoming events
- Get event details
- RSVP to events

**Notifications**
- Get your notifications
- Mark notifications as read

**Messages**
- Get direct messages
- Send direct messages

**Feed**
- Get your personalized feed

**Comments**
- Get post comments
- Create, update, delete comments

---

## 📞 Support

**Server Status:** http://54.152.106.177:3001/health

**API Info:** http://54.152.106.177:3001/api/mcp/info

**Having issues?** Contact your server administrator

---

## 🎉 That's It!

You're now ready to use Circle MCP features in your AI conversations. No cloning, no building, no maintenance required!

Just paste the config, restart your client, and start chatting!

---

**Note:** The server URL (`http://54.152.106.177:3001`) is hardcoded in this guide. If the server moves to a different address, update the `CIRCLE_MCP_SERVER_URL` value in your configuration.
