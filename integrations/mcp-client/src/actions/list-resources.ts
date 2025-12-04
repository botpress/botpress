import { McpClient, wrapWithTryCatch } from '../mcp-api'
import type * as bp from '.botpress'

const _listResources: bp.IntegrationProps['actions']['listResources'] = async ({ ctx, logger }) => {
  logger.forBot().info('Listing MCP resources...')

  const client = McpClient.create(ctx)

  try {
    await client.initialize()
    const resources = await client.listResources()

    logger.forBot().info(`Found ${resources.length} MCP resources`)

    return { resources }
  } finally {
    await client.disconnect()
  }
}

export const listResources = wrapWithTryCatch(_listResources, 'Failed to list MCP resources')
