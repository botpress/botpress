import { getClient } from '../client';
import { getFileInputSchema, getFileOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const getFile: Implementation['actions']['getFile'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getFileInputSchema.parse(input);

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
    const result = await zohoClient.getFile(validatedInput.fileId);

    logger.forBot().info(`Successful - Get File - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Get File' exception: ${JSON.stringify(errorMessage)}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
