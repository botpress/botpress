import { getClient } from '../client';
import { getRecordByIdInputSchema, getRecordByIdOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const getRecordById: Implementation['actions']['getRecordById'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getRecordByIdInputSchema.parse(input);

  const zohoClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  );

  logger.forBot().info(`Validated Input - ${JSON.stringify(validatedInput)}`);

  try {
    const result = await zohoClient.getRecordById(validatedInput.module, validatedInput.recordId);

    logger.forBot().info(`Successful - Get Record By ID - Module: ${validatedInput.module}, Record ID: ${validatedInput.recordId}`);
    logger.forBot().debug(`Result - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Get Record By ID' exception: ${JSON.stringify(errorMessage)}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
