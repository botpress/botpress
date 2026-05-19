import { getAuthenticatedHubspotClient } from '../utils'
import * as bp from '.botpress'

export const getFileUrl: bp.IntegrationProps['actions']['getFileUrl'] = async ({ ctx, client, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  try {
    const url = await hsClient.getFileUrl({ filePath: input.filePath })
    return { url }
  } catch (err) {
    logger.forBot().debug(`File ${input.filePath} URL could not be retrieved: ${err}`)
    return { url: undefined }
  }
}
