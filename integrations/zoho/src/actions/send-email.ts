import { getClient } from '../client'
import { sendMailInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const sendMail: IntegrationProps['actions']['sendMail'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = sendMailInputSchema.parse(input)

  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  logger.forBot().info(`Validated Input - ${JSON.stringify(validatedInput)}`)

  try {
    const result = await zohoClient.sendMail(validatedInput.module, validatedInput.recordId, validatedInput.data)
    logger.forBot().info('Successful - Send Mail')
    logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Send Mail' exception: ${errorMessage}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
