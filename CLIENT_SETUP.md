# Circle MCP Client Setup Guide

Simple guide to connect your AI assistant to the Circle MCP Server.

---

## 📋 What You'll Need

- Claude Desktop (recommended) or any MCP-compatible client
- Internet connection
- 5 minutes of your time

---

## 🖥️ Claude Desktop Setup

### Step 1: Install Claude Desktop

Download and install Claude Desktop from: https://claude.ai/download

### Step 2: Locate Configuration File

Open the configuration file for your operating system:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

**Quick Access:**
- Windows: Press `Win+R`, type `%APPDATA%\Claude`, press Enter
- Mac: Press `Cmd+Shift+G`, paste the path above, press Enter

### Step 3: Edit Configuration

Open `claude_desktop_config.json` in a text editor (Notepad, TextEdit, VS Code, etc.)

**If the file is empty or new**, paste this:

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/client-websocket",
        "ws://circle-mcp.duckdns.org:3000"
      ]
    }
  }
}
```

**If you already have mcpServers**, just add the "circle" section:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "circle": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/client-websocket",
        "ws://circle-mcp.duckdns.org:3000"
      ]
    }
  }
}
```

### Step 4: Save and Restart

1. Save the file (`Ctrl+S` or `Cmd+S`)
2. **Completely quit** Claude Desktop (not just close the window)
3. Reopen Claude Desktop

### Step 5: Verify Connection

In Claude Desktop, type:

```
Can you check if Circle MCP is connected?
```

If connected, you should see Circle MCP tools available!

---

## 🚀 Using Circle Features

### First Time: Authenticate

Before using Circle features, you need to authenticate:

```
Please authenticate with Google to access Circle features
```

This will:
1. Open your browser
2. Ask you to sign in with Google
3. Connect your Circle account
4. Return you to Claude

### Example Commands

Once authenticated, try these:

**Profile:**
```
Show me my Circle profile
```

**Courses:**
```
What courses am I enrolled in?
```

**Posts:**
```
Show me recent posts in the community
```

**Events:**
```
What events are coming up?
```

**Notifications:**
```
Check my notifications
```

**Create a Post:**
```
Create a post in the General space with title "Hello!" and body "My first post via Claude"
```

---

## 🔧 Other MCP Clients

### VS Code with Cline

1. Install Cline extension from VS Code marketplace
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Type "Cline: Open Settings"
4. Navigate to MCP Servers
5. Click "Edit in settings.json"
6. Add:

```json
{
  "cline.mcpServers": {
    "circle": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/client-websocket",
        "ws://circle-mcp.duckdns.org:3000"
      ]
    }
  }
}
```

7. Reload VS Code

### Continue (VS Code Extension)

1. Install Continue extension
2. Open Continue settings
3. Add to MCP servers configuration:

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/client-websocket",
        "ws://circle-mcp.duckdns.org:3000"
      ]
    }
  }
}
```

### Custom MCP Client

Connect to WebSocket endpoint:
```
ws://circle-mcp.duckdns.org:3000
```

Use the MCP SDK to establish connection.

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Circle MCP"

**Solutions:**
1. Check internet connection
2. Verify the WebSocket URL is correct
3. Restart Claude Desktop completely
4. Check server status at: http://circle-mcp.duckdns.org:3000/health

### Issue: "Authentication failed"

**Solutions:**
1. Make sure you're signed in with Google
2. Check that your Google account is registered in the Circle community
3. Try logging out and authenticating again:
   ```
   Logout from Circle
   ```
   Then authenticate again.

### Issue: "Circle MCP tools not showing"

**Solutions:**
1. Verify `claude_desktop_config.json` syntax is correct (valid JSON)
2. Make sure you completely quit and restarted Claude Desktop
3. Check Claude Desktop logs:
   - Windows: `%APPDATA%\Claude\logs\`
   - Mac: `~/Library/Logs/Claude/`
   - Look for error messages about Circle MCP

### Issue: "npx command not found"

**Solution:**
Install Node.js from https://nodejs.org/ (includes npx)

After installation, restart Claude Desktop.

### Issue: "WebSocket connection timeout"

**Solutions:**
1. Check firewall isn't blocking WebSocket connections
2. Verify server is running: http://circle-mcp.duckdns.org:3000/health
3. Try connecting from a different network
4. Contact server administrator

---

## 📊 Server Information

**Server URL:** ws://circle-mcp.duckdns.org:3000
**Health Check:** http://circle-mcp.duckdns.org:3000/health
**API Info:** http://circle-mcp.duckdns.org:3000/api/mcp/info

**Available Tools:** 20+
- Authentication (Google OAuth)
- Profile Management
- Course Access
- Post Management
- Event Management
- Notifications
- Direct Messages
- Space Management
- Comments & Interactions

---

## 🔒 Security & Privacy

- **Authentication**: Secure Google OAuth 2.0
- **Data Access**: Only YOUR data (filtered by your email)
- **Permissions**: Read and write access to your Circle community
- **Storage**: Tokens stored securely on your device
- **Logout**: Use "logout" command to clear your session anytime

---

## 📚 Additional Resources

- **Circle MCP GitHub**: https://github.com/yourusername/circle-mcp
- **MCP Documentation**: https://modelcontextprotocol.io/
- **Claude Desktop**: https://claude.ai/desktop
- **Circle.so**: https://circle.so/

---

## ❓ Need Help?

1. Check server health: http://circle-mcp.duckdns.org:3000/health
2. Review troubleshooting section above
3. Check GitHub issues: https://github.com/yourusername/circle-mcp/issues
4. Contact your Circle community administrator

---

**🎉 Enjoy using Circle MCP with your AI assistant!**
