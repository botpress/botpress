import { McpClient } from './mcp-api'
import type * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  logger.forBot().info('Registering MCP Client integration...')

  const client = McpClient.create(ctx)

  try {
    await client.initialize()
    await client.listTools()
    logger.forBot().info('Successfully connected to MCP server')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to connect to MCP server: ${message}`)
    throw error
  } finally {
    await client.disconnect()
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Unregistering MCP Client integration')
}
