import { getClient } from '../client';
import { insertRecordInputSchema, insertRecordOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const insertRecord: Implementation['actions']['insertRecord'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = insertRecordInputSchema.parse(input);
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
    const result = await zohoClient.insertRecord(validatedInput.module, validatedInput.data);

    logger.forBot().info(`Successful - Insert Record`);
    logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Insert Record' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
