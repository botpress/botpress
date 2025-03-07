import { getClient } from '../client'
import { updateAppointmentInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const updateAppointment: IntegrationProps['actions']['updateAppointment'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = updateAppointmentInputSchema.parse(input)

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
    // Call Zoho API to update the appointment
    const result = await zohoClient.updateAppointment(validatedInput.appointmentId, validatedInput.data)

    logger.forBot().info('Successful - Update Appointment')
    logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`)

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    logger.forBot().error(`'Update Appointment' exception: ${errorMessage}`)

    return {
      success: false,
      message: errorMessage,
      data: null,
    }
  }
}
