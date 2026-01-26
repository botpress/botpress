import { getClient } from '../client'
import { createContactInputSchema, createContactOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

export const createContact: Implementation['actions']['createContact'] = async ({ ctx, client, logger, input }) => {
  const validatedInputString = createContactInputSchema.parse(input)
  const validatedInput = JSON.parse(validatedInputString.properties)

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
    const result = await ghlClient.createContact(validatedInput)

    logger.forBot().info(`Successful - Create Contact - ${JSON.stringify(validatedInput)}`)
    logger.forBot().info(`Result - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Create Contact' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
