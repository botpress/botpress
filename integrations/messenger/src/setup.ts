import { RuntimeError } from '@botpress/sdk'
import { getMetaClientCredentials } from './misc/auth'
import { createMetaClient } from './misc/meta-client'

import * as bp from '.botpress'
import type { ManualConfig } from '.botpress/implementation/typings/configurations/manual'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { ctx } = props
  if (ctx.configurationType === 'manual') {
    await _registerManual(props, ctx.configuration)
  } else if (ctx.configurationType === 'sandbox') {
    await _registerSandbox(props)
  } else {
    await _registerOAuth(props)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _registerManual = async (props: RegisterProps, config: ManualConfig) => {
  const { client, logger, ctx } = props
  logger.forBot().debug('Registering manual')

  const { pageId, accessToken } = config

  if (!accessToken || !pageId) {
    throw new RuntimeError('Missing access token or page ID')
  }

  try {
    const metaClient = await createMetaClient(ctx, client, logger)

    await _clearAllIdentifiers(props)
    await _unsubscribeFromOAuthWebhooks(props)
    await metaClient.subscribeToWebhooks(pageId)

    logger.forBot().info(`Successfully registered manual integration for page ${pageId}`)
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to register manual integration: ' + error.message, error)
  }
}

const _registerSandbox = async (props: RegisterProps) => {
  await _clearAllIdentifiers(props)
  await _unsubscribeFromOAuthWebhooks(props)
}

const _registerOAuth = async ({ client }: RegisterProps) => {
  // Only remove sandbox identifiers
  await client.configureIntegration({
    sandboxIdentifiers: null,
  })
}

const _unsubscribeFromOAuthWebhooks = async ({ ctx, logger, client }: RegisterProps) => {
  const credentials = await getOAuthMetaClientCredentials(client, ctx).catch(() => undefined)
  if (!credentials) {
    // No credentials means the OAuth flow hasn't been completed yet
    return
  }

  const { pageId } = credentials
  const metaClient = await createAuthenticatedMetaClient('oauth', ctx, client, logger)
  if (await metaClient.isSubscribedToWebhooks(pageId)) {
    await metaClient.unsubscribeFromWebhooks(pageId)
  }
}

const _clearAllIdentifiers = async ({ client }: RegisterProps) => {
  await client.configureIntegration({
    identifier: null,
    sandboxIdentifiers: null,
  })
}
