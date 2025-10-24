import { getOAuthMetaClientCredentials } from './misc/auth'
import { createAuthenticatedMetaClient } from './misc/meta-client'
import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { ctx } = props
  if (ctx.configurationType === 'manual') {
    await _registerManual(props)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _registerManual = async (props: RegisterProps) => {
  await _clearAllIdentifiers(props)
  await _unsubscribeFromOAuthWebhooks(props)
}

const _unsubscribeFromOAuthWebhooks = async ({ ctx, logger, client }: RegisterProps) => {
  const credentials = await getOAuthMetaClientCredentials(client, ctx).catch(() => undefined)
  if (!credentials) {
    // No credentials means the OAuth flow hasn't been completed yet
    return
  }

  const { pageId } = credentials
  if (!pageId) {
    // No page ID means the OAuth flow was probably never fully completed
    return
  }

  const metaClient = await createAuthenticatedMetaClient({ configType: 'oauth', ctx, client, logger })

  if (await metaClient.isSubscribedToWebhooks(pageId)) {
    await metaClient.unsubscribeFromWebhooks(pageId)
  }
}

const _clearAllIdentifiers = async ({ client }: RegisterProps) => {
  await client.configureIntegration({
    identifier: null,
  })
}
