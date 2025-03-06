import { getClient } from '../client';
import { getUsersInputSchema, getUsersOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const getUsers: Implementation['actions']['getUsers'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = getUsersInputSchema.parse(input);
  const params = validatedInput.params ?? "{}"; // Ensure params is always a valid JSON string

  const zohoClient = getClient(
    ctx.configuration.accessToken,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  );

  logger.forBot().info(`Validated Input - Params: ${params}`);

  try {
    const result = await zohoClient.getUsers(params);

    logger.forBot().info(`Successful - Get Users`);
    logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`);

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Get Users' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};
