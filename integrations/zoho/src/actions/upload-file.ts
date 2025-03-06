import { getClient } from "../client";
import { uploadFileInputSchema, uploadFileOutputSchema } from "../misc/custom-schemas";
import type { Implementation } from "../misc/types";

export const uploadFile: Implementation["actions"]["uploadFile"] = async ({ ctx, client, logger, input }) => {
    const validatedInput = uploadFileInputSchema.parse(input);
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
        // Call Zoho API to upload file
        const result = await zohoClient.uploadFile(validatedInput.fileUrl);

        logger.forBot().info(`Successful - Upload File`);
        logger.forBot().debug(`Upload File Result - ${JSON.stringify(result.data)}`);

        return {
            success: result.success,
            message: result.message,
            data: result.data,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        logger.forBot().error(`'Upload File' exception: ${errorMessage}`);

        return {
            success: false,
            message: errorMessage,
            data: null,
        };
    }
};
