import { RuntimeError } from '@botpress/sdk'
import { McpClient, wrapWithTryCatch } from '../mcp-api'
import type * as bp from '.botpress'

const _readResource: bp.IntegrationProps['actions']['readResource'] = async ({ ctx, input, logger }) => {
  const { uri } = input

  if (!uri || uri.trim() === '') {
    throw new RuntimeError('Resource URI is required')
  }

  logger.forBot().info(`Reading MCP resource "${uri}"...`)

  const client = McpClient.create(ctx)

  try {
    await client.initialize()
    const contents = await client.readResource(uri)

    logger.forBot().info(`Successfully read MCP resource "${uri}"`)

    return { contents }
  } finally {
    await client.disconnect()
  }
}

export const readResource = wrapWithTryCatch(_readResource, 'Failed to read MCP resource')
