import { getAuthenticatedHubspotClient } from '../utils'
import * as bp from '.botpress'

export const getFileUrl: bp.IntegrationProps['actions']['getFileUrl'] = async ({ ctx, client, input, logger }) => {
  const hsClient = await getAuthenticatedHubspotClient({ ctx, client, logger })
  try {
    const url = await hsClient.getFileUrl({ fileName: input.fileName })
    return { url }
  } catch (err: unknown) {
    logger.forBot().debug(`File ${input.fileName} URL could not be retrieved: ${err}`)
    return { url: undefined }
  }
}
