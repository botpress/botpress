import { getClient } from '../client';
import { getRecordsInputSchema, getRecordsOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const getRecords: Implementation['actions']['getRecords'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getRecordsInputSchema.parse(input);
  const params = validatedInput.params ?? "{}"; // Default to empty JSON if no params provided

  const zohoClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  );

  logger.forBot().info(`Validated Input - Module: ${validatedInput.module}, Params: ${params}`);

  try {
    const result = await zohoClient.getRecords(validatedInput.module, params);

    logger.forBot().info(`Successful - Get Records - Module: ${validatedInput.module}`);
    logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Get Records' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
