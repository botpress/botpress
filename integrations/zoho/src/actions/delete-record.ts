import { getClient } from '../client';
import { deleteRecordInputSchema, deleteRecordOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const deleteRecord: Implementation['actions']['deleteRecord'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = deleteRecordInputSchema.parse(input);

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
    const result = await zohoClient.deleteRecord(validatedInput.module, validatedInput.recordId);

    logger.forBot().info(`Successful - Delete Record - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Delete Record' exception: ${JSON.stringify(errorMessage)}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
