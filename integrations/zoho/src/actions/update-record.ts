import { getClient } from '../client';
import { updateRecordInputSchema, updateRecordOutputSchema } from '../misc/custom-schemas';
import type { Implementation } from '../misc/types';

export const updateRecord: Implementation['actions']['updateRecord'] = async ({ ctx, client, logger, input }) => {
    const validatedInput = updateRecordInputSchema.parse(input);
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
        const result = await zohoClient.updateRecord(validatedInput.module, validatedInput.recordId, validatedInput.data);

        logger.forBot().info(`Successful - Update Record`);
        logger.forBot().debug(`Result Data - ${JSON.stringify(result.data)}`);

        return {
            success: result.success,
            message: result.message,
            data: result.data,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        logger.forBot().error(`'Update Record' exception: ${errorMessage}`);

        return {
            success: false,
            message: errorMessage,
            data: null,
        };
    }
};
