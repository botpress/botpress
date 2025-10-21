import { getOAuthMetaClientCredentials } from './misc/auth'
import { createAuthenticatedMetaClient } from './misc/meta-client'

import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { ctx } = props
  if (ctx.configurationType === 'manual') {
    await _registerManual(props)
  } else {
    await _registerOAuth(props)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _registerManual = async (props: RegisterProps) => {
  await _clearAllIdentifiers(props)
  await _unsubscribeFromOAuthWebhooks(props)
}

const _registerOAuth = async ({ client }: RegisterProps) => {
  // Clear identifiers if needed
  await client.configureIntegration({
    identifier: null,
  })
}

const _unsubscribeFromOAuthWebhooks = async ({ ctx, logger, client }: RegisterProps) => {
  const credentials = await getOAuthMetaClientCredentials(client, ctx).catch(() => undefined)
  if (!credentials) {
    // No credentials means the OAuth flow hasn't been completed yet
    return
  }

  const { pageId } = credentials
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
