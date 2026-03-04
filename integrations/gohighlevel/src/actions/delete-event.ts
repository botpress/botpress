import { getClient } from '../client'
import { deleteEventInputSchema, deleteEventOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const deleteEvent: Implementation['actions']['deleteEvent'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = deleteEventInputSchema.parse(input)

  const ghlClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx,
    client
  )

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`)

  try {
    const result = await ghlClient.deleteEvent(validatedInput.eventId)

    logger.forBot().info(`Successful - Delete Event - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Delete Event' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
