import { McpClient, wrapWithTryCatch } from '../mcp-api'
import type * as bp from '.botpress'

const _listTools: bp.IntegrationProps['actions']['listTools'] = async ({ ctx, logger }) => {
  logger.forBot().info('Listing MCP tools...')

  const client = McpClient.create(ctx)

  try {
    await client.initialize()
    const tools = await client.listTools()

    logger.forBot().info(`Found ${tools.length} MCP tools`)

    return { tools }
  } finally {
    await client.disconnect()
  }
}

export const listTools = wrapWithTryCatch(_listTools, 'Failed to list MCP tools')
