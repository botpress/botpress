import { getAuthenticatedHubspotClient } from '../utils'
import * as bp from '.botpress'

export const getFileSignedUrl: bp.IntegrationProps['actions']['getFileSignedUrl'] = async ({
  ctx,
  client,
  input,
  logger,
}) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  try {
    const signed = await hsClient.getFileSignedUrl({
      fileId: input.fileId,
      expirationSeconds: input.expirationSeconds,
    })
    return {
      url: signed.url,
      name: signed.name,
      extension: signed.extension,
      type: signed.type,
      size: signed.size,
      expiresAt: signed.expiresAt?.toISOString(),
    }
  } catch (err) {
    logger.forBot().debug(`File ${input.fileId} signed URL could not be retrieved: ${err}`)
    return { url: null }
  }
}
