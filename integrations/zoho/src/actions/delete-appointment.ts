import { getClient } from '../client';
import { deleteAppointmentInputSchema, deleteAppointmentOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const deleteAppointment: Implementation['actions']['deleteAppointment'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = deleteAppointmentInputSchema.parse(input);

  const zohoClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  );

  logger.forBot().debug(`Validated Input - ${JSON.stringify(validatedInput)}`);

  try {
    const result = await zohoClient.deleteAppointment(validatedInput.appointmentId);
    
    logger.forBot().info(`Successful - Delete Appointment - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Delete Appointment' exception: ${JSON.stringify(errorMessage)}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
