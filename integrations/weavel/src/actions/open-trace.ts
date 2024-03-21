import { getClient } from 'src/client'
import { OpenTraceRequest } from 'src/client/types'
import { openTraceInputSchema } from 'src/misc/schemas'
import type { Implementation } from '../misc/types'

export const openTrace: Implementation['actions']['openTrace'] = async ({ ctx, input, logger }) => {
  const validatedInput = openTraceInputSchema.parse(input)
  const weavelClient = getClient(ctx.configuration.apiKey)
  const data: OpenTraceRequest = {
    trace_id: validatedInput.conversationId,
    user_id: ctx.botUserId,
    metadata: validatedInput.metadata && JSON.parse(validatedInput.metadata),
  }
  let success = false
  try {
    await weavelClient.openTrace(data)
    success = true
    logger.forBot().info('Successful - Open trace')
  } catch (error) {
    logger.forBot().debug(`'Open trace' exception ${JSON.stringify(error)}`)
  }
  return {
    success,
  }
}
