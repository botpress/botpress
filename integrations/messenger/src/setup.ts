import { getMetaClientCredentials } from './misc/auth'
import { MetaClient } from './misc/meta-client'
import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { ctx, client } = props
  if (ctx.configurationType === 'manualApp') {
    await client.configureIntegration({
      identifier: null,
    })
    await _unsubscribeFromWebhooks(props)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _unsubscribeFromWebhooks = async ({ ctx, logger, client }: RegisterProps) => {
  const metaClient = new MetaClient(logger)
  const { pageToken, pageId } = await getMetaClientCredentials(client, ctx)
  await metaClient.unsubscribeFromWebhooks(pageToken, pageId)
}
