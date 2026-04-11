# nibbo-mcp

Read-only [Model Context Protocol](https://modelcontextprotocol.io/) server for the Nibbo app in this repository. It calls Nibbo with `Authorization: Bearer <token>`.

## Recommended: key from your profile

In the Nibbo web app open **Profile** → section **MCP (read-only)** → **New key**. Copy the token **once** and use it below as `NIBBO_MCP_READ_TOKEN`. Keys are stored hashed in the database; each user manages their own keys.

## Tools (read-only)

| Tool | Description |
|------|-------------|
| `nibbo_list_tasks` | Task boards, columns, open tasks |
| `nibbo_list_events` | Events; optional `from` / `to` ISO query |
| `nibbo_list_shopping` | Shopping lists and items |
| `nibbo_list_notes` | Notes with categories |
| `nibbo_task_stats` | Personal stats for the token’s user + family XP |

## Optional server env (fallback)

For automation only, the deployed Nibbo app can accept **`NIBBO_MCP_READ_TOKENS`**: comma-separated `userId|secret` pairs. Profile keys in the database are always checked first.

## Build and run

```bash
cd nibbo-mcp
npm install
npm run build
```

Stdio transport (used by Cursor and similar clients):

```bash
node dist/index.js
```

Environment for **this** process (MCP package):

| Variable | Required | Description |
|----------|----------|-------------|
| `NIBBO_MCP_READ_TOKEN` | yes | Secret from Nibbo Profile → MCP (or a `secret` from server `NIBBO_MCP_READ_TOKENS`) |
| `NIBBO_API_URL` | no | Default `http://localhost:3000` |

## Cursor MCP config

Use an absolute path to `dist/index.js` after `npm run build`.

```json
{
  "mcpServers": {
    "nibbo": {
      "command": "node",
      "args": ["D:/work/projects/petprojects/nibbo/nibbo-mcp/dist/index.js"],
      "env": {
        "NIBBO_API_URL": "http://localhost:3000",
        "NIBBO_MCP_READ_TOKEN": "paste-key-from-nibbo-profile"
      }
    }
  }
}
```

On Windows, keep forward slashes or escaped backslashes in JSON paths as required by your editor.

## Security notes

- Treat each MCP key like a password. Revoke it in Profile if it leaks.
- Write operations are not implemented in this package.
