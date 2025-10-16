# Circle MCP Client

Simple client proxy for connecting to remote Circle MCP server.

## Installation

### Option 1: NPM Global Install (Recommended)

```bash
npm install -g circle-mcp-client
```

### Option 2: NPX (No Installation)

```bash
npx circle-mcp-client
```

### Option 3: Manual

```bash
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp/client
npm install
```

## Usage

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": ["-y", "circle-mcp-client"],
      "env": {
        "CIRCLE_MCP_SERVER_URL": "http://YOUR_SERVER_IP:3001"
      }
    }
  }
}
```

### Cursor Configuration

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": ["-y", "circle-mcp-client"],
      "env": {
        "CIRCLE_MCP_SERVER_URL": "http://YOUR_SERVER_IP:3001"
      }
    }
  }
}
```

Replace `YOUR_SERVER_IP` with your actual server IP address.

## Environment Variables

- `CIRCLE_MCP_SERVER_URL` - URL of the remote MCP server (required)

## Example

```json
{
  "mcpServers": {
    "circle": {
      "command": "npx",
      "args": ["-y", "circle-mcp-client"],
      "env": {
        "CIRCLE_MCP_SERVER_URL": "http://54.221.177.237:3001"
      }
    }
  }
}
```

That's it! No need to clone or install anything else. Just paste and use!
