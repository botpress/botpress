import { getClient } from 'src/client'
import { CaptureTraceDataRequest } from 'src/client/types'
import { captureTraceDataInputSchema } from 'src/misc/schemas'
import type { Implementation } from '../misc/types'

export const captureTraceData: Implementation['actions']['captureTraceData'] = async ({ ctx, input, logger }) => {
  const validatedInput = captureTraceDataInputSchema.parse(input)
  const weavelClient = getClient(ctx.configuration.apiKey)
  const data: CaptureTraceDataRequest = {
    user_id: ctx.botUserId,
    trace_id: validatedInput.conversationId,
    role: validatedInput.type,
    content: validatedInput.content,
    metadata: validatedInput.metadata && JSON.parse(validatedInput.metadata),
  }
  let success = false
  try {
    await weavelClient.captureTraceData(data)
    success = true
    logger.forBot().info('Successful - Capture trace data')
  } catch (error) {
    logger.forBot().debug(`'Capture trace data' exception ${JSON.stringify(error)}`)
  }
  return {
    success,
  }
}
