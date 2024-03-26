import { getClient } from 'src/client'
import { CaptureTrackEventRequest } from 'src/client/types'
import { captureTrackEventInputSchema } from 'src/misc/schemas'
import type { Implementation } from '../misc/types'

export const captureTrackEvent: Implementation['actions']['captureTrackEvent'] = async ({ ctx, input, logger }) => {
  const validatedInput = captureTrackEventInputSchema.parse(input)
  const weavelClient = getClient(ctx.configuration.apiKey)
  const data: CaptureTrackEventRequest = {
    user_id: ctx.botUserId,
    name: validatedInput.name,
    properties: validatedInput.properties && JSON.parse(validatedInput.properties),
  }
  let success = false
  try {
    await weavelClient.captureTrackEvent(data)
    success = true
    logger.forBot().info('Successful - Capture track event')
  } catch (error) {
    logger.forBot().debug(`'Capture track event' exception ${JSON.stringify(error)}`)
  }
  return {
    success,
  }
}
