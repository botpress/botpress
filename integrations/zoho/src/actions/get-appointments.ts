import { getClient } from '../client'
import { getAppointmentsInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const getAppointments: IntegrationProps['actions']['getAppointments'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = getAppointmentsInputSchema.parse(input)
  const params = validatedInput.params ?? '{}'

  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  )

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`)

  try {
    const result = await zohoClient.getAppointments(params)

    logger.forBot().info(`Successful - Get Appointments - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Get Appointments' exception: ${JSON.stringify(errorMessage)}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
