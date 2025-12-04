import { RuntimeError } from '@botpress/sdk'
import { McpClient, wrapWithTryCatch } from '../mcp-api'
import type * as bp from '.botpress'

const _callTool: bp.IntegrationProps['actions']['callTool'] = async ({ ctx, input, logger }) => {
  const { name, arguments: args } = input

  if (!name || name.trim() === '') {
    throw new RuntimeError('Tool name is required')
  }

  logger.forBot().info(`Calling MCP tool "${name}"...`)

  const client = McpClient.create(ctx)

  try {
    await client.initialize()
    const result = await client.callTool(name, args)

    if (result.isError) {
      logger.forBot().warn(`MCP tool "${name}" returned an error`)
    } else {
      logger.forBot().info(`Successfully called MCP tool "${name}"`)
    }

    return result
  } finally {
    await client.disconnect()
  }
}

export const callTool = wrapWithTryCatch(_callTool, 'Failed to call MCP tool')
