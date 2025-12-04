import * as sdk from '@botpress/sdk'
const { z } = sdk

const mcpToolSchema = z.object({
  name: z.string().title('Name').describe('Unique identifier for the tool'),
  description: z.string().optional().title('Description').describe('Human-readable description of what the tool does'),
  inputSchema: z.any().optional().title('Input Schema').describe('JSON Schema describing the expected input'),
})

const mcpResourceSchema = z.object({
  uri: z.string().title('URI').describe('Unique identifier for the resource'),
  name: z.string().title('Name').describe('Human-readable name for the resource'),
  description: z.string().optional().title('Description').describe('Description of the resource'),
  mimeType: z.string().optional().title('MIME Type').describe('MIME type of the resource content'),
})

const mcpContentSchema = z.object({
  type: z.enum(['text', 'image', 'resource']).title('Type').describe('Type of content'),
  text: z.string().optional().title('Text').describe('Text content (for type "text")'),
  data: z.string().optional().title('Data').describe('Base64-encoded data (for type "image")'),
  mimeType: z.string().optional().title('MIME Type').describe('MIME type of the content'),
})

const mcpResourceContentSchema = z.object({
  uri: z.string().title('URI').describe('URI of the resource'),
  mimeType: z.string().optional().title('MIME Type').describe('MIME type of the content'),
  text: z.string().optional().title('Text').describe('Text content of the resource'),
  blob: z.string().optional().title('Blob').describe('Base64-encoded binary content'),
})

export const actions = {
  listTools: {
    title: 'List Tools',
    description: 'Lists all available tools on the MCP server',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        tools: z.array(mcpToolSchema).title('Tools').describe('List of available MCP tools'),
      }),
    },
  },
  callTool: {
    title: 'Call Tool',
    description: 'Calls a specific tool on the MCP server with the provided arguments',
    input: {
      schema: z.object({
        name: z.string().title('Tool Name').describe('Name of the MCP tool to call'),
        arguments: z
          .record(z.any())
          .optional()
          .title('Arguments')
          .describe('Arguments to pass to the tool as a JSON object'),
      }),
    },
    output: {
      schema: z.object({
        content: z.array(mcpContentSchema).title('Content').describe('Content returned by the tool'),
        isError: z.boolean().optional().title('Is Error').describe('Whether the tool call resulted in an error'),
      }),
    },
  },
  listResources: {
    title: 'List Resources',
    description: 'Lists all available resources on the MCP server',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        resources: z.array(mcpResourceSchema).title('Resources').describe('List of available MCP resources'),
      }),
    },
  },
  readResource: {
    title: 'Read Resource',
    description: 'Reads the content of a specific resource from the MCP server',
    input: {
      schema: z.object({
        uri: z.string().title('Resource URI').describe('URI of the resource to read'),
      }),
    },
    output: {
      schema: z.object({
        contents: z.array(mcpResourceContentSchema).title('Contents').describe('Content of the resource'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
