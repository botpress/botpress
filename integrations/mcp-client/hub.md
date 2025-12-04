Connect your Botpress bot to any MCP (Model Context Protocol) server to leverage external tools and resources. MCP is an open protocol that enables AI applications to securely access data sources, tools, and workflows from external systems.

## What is MCP?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that allows AI applications to connect to external tools and data sources in a standardized way. With this integration, your Botpress bot can:

- **Call Tools**: Execute functions exposed by MCP servers (e.g., search, database queries, API calls)
- **Read Resources**: Access data and content from MCP servers (e.g., files, documents, configurations)

## Configuration

### Server URL

The URL of your MCP server's SSE endpoint. This is typically the base URL of your MCP server with `/sse` appended.

**Example**: `http://localhost:3000/sse`

### API Key (Optional)

If your MCP server requires authentication, provide the API key here. This will be sent as a Bearer token in the Authorization header.

### Timeout

The request timeout in milliseconds. Default is 30000 (30 seconds). Increase this value if your MCP tools perform long-running operations.

## Actions

### List Tools

Lists all available tools exposed by the MCP server. Use this to discover what capabilities the server provides.

**Output:**

- `tools`: Array of tool objects containing:
  - `name`: Unique identifier for the tool
  - `description`: Human-readable description
  - `inputSchema`: JSON Schema describing expected input

### Call Tool

Executes a specific tool on the MCP server.

**Input:**

- `name`: Name of the tool to call
- `arguments`: JSON object with arguments to pass to the tool

**Output:**

- `content`: Array of content items returned by the tool
- `isError`: Boolean indicating if the tool call resulted in an error

### List Resources

Lists all available resources on the MCP server.

**Output:**

- `resources`: Array of resource objects containing:
  - `uri`: Unique identifier for the resource
  - `name`: Human-readable name
  - `description`: Description of the resource
  - `mimeType`: MIME type of the content

### Read Resource

Reads the content of a specific resource.

**Input:**

- `uri`: URI of the resource to read

**Output:**

- `contents`: Array of content items from the resource

## Example Usage

### Calling a Search Tool

```javascript
// First, list available tools
const { tools } = await actions.mcpClient.listTools({})
console.log(
  'Available tools:',
  tools.map((t) => t.name)
)

// Call the search tool
const result = await actions.mcpClient.callTool({
  name: 'search',
  arguments: {
    query: 'Botpress documentation',
  },
})

console.log('Search results:', result.content)
```

### Reading a Resource

```javascript
// List available resources
const { resources } = await actions.mcpClient.listResources({})
console.log(
  'Available resources:',
  resources.map((r) => r.name)
)

// Read a specific resource
const { contents } = await actions.mcpClient.readResource({
  uri: 'file:///config/settings.json',
})

console.log('Resource content:', contents)
```

## Testing with MCP Servers

Here are some MCP servers you can use for testing:

| Server           | Description                        | GitHub                                                                                                     |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Everything**   | Test server with all MCP features  | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/everything)   |
| **Fetch**        | Fetch URLs and convert to markdown | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)        |
| **Brave Search** | Web search via Brave API           | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) |

## Limitations

- **SSE Transport Only**: This integration uses Server-Sent Events (SSE) transport. Local stdio-based MCP servers are not supported.
- **Cloud Connectivity**: Your MCP server must be accessible from Botpress cloud infrastructure. Servers running on localhost are only accessible during local development.
- **Stateless Connections**: Each action creates a new connection to the MCP server. Connection pooling may be added in future versions.

## Troubleshooting

### Connection Failed

If you see "Failed to connect to MCP server", verify:

1. The server URL is correct and includes the SSE endpoint path
2. The MCP server is running and accessible from the internet
3. Any required API key is correctly configured

### Timeout Errors

If operations are timing out:

1. Increase the timeout configuration value
2. Check if the MCP server is responding slowly
3. Verify network connectivity between Botpress and your MCP server

### Tool Not Found

If a tool call fails with "tool not found":

1. Use the `listTools` action to verify available tools
2. Check the exact tool name spelling
3. Ensure the MCP server exposes the expected tools

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
