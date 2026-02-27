import { getClient } from '../client'
import { updateContactInputSchema, updateContactOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const updateContact: Implementation['actions']['updateContact'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = updateContactInputSchema.parse(input)

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
    const result = await ghlClient.updateContact(validatedInput.contactId, validatedInput.properties)

    logger.forBot().info(`Successful - Update Contact - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Update Contact' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
