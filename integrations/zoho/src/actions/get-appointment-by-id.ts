import { getClient } from '../client';
import { getAppointmentByIdInputSchema, getAppointmentByIdOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const getAppointmentById: Implementation['actions']['getAppointmentById'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getAppointmentByIdInputSchema.parse(input);

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
    const result = await zohoClient.getAppointmentById(validatedInput.appointmentId);

    logger.forBot().info(`Successful - Get Appointment By ID - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Get Appointment By ID' exception: ${JSON.stringify(errorMessage)}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
