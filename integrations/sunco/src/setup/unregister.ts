import { deleteApp } from 'src/api/webhooks'
import { getStoredCredentials } from 'src/get-stored-credentials'
import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { client, ctx, logger } = props
  logger.forBot().info('Starting Sunshine Conversations integration unregistration...')

  const credentials = await getStoredCredentials(client, ctx)
  if (credentials.configType === 'manual') {
    logger.forBot().info('Configuration type is manual, nothing to unregister.')
    return
  }

  await deleteApp({ credentials, logger })
}
