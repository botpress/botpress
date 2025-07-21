import { getMetaClientCredentials } from './misc/auth'
import { MetaClient } from './misc/meta-client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async () => {}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, logger, client }) => {
  if (ctx.configurationType === null) {
    await client.configureIntegration({
      identifier: null,
    })

    const metaClient = new MetaClient(logger)
    const { pageToken, pageId } = await getMetaClientCredentials(client, ctx)
    await metaClient.unsubscribeFromWebhooks(pageToken, pageId)
  }
}
