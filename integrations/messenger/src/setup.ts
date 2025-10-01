import { RuntimeError } from '@botpress/sdk'
import { getMetaClientCredentials } from './misc/auth'
import { MetaClient } from './misc/meta-client'

import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  const { ctx } = props
  if (ctx.configurationType === 'manual') {
    await _registerManual(props)
  } else if (ctx.configurationType === 'sandbox') {
    await _registerSandbox(props)
  } else {
    await _registerOAuth(props)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _registerManual = async (props: RegisterProps) => {
  const { client, ctx, logger } = props
  logger.forBot().debug('Registering manual')

  if (ctx.configurationType !== 'manual') {
    logger.forBot().warn('Manual configuration is not supported')
    return
  }

  const { pageId, accessToken } = ctx.configuration

  if (!accessToken || !pageId) {
    logger.forBot().warn('Missing accessToken or pageId in manual configuration')
    return
  }

  try {
    const metaClient = new MetaClient(logger)

    // Clear any existing identifiers
    await _clearAllIdentifiers(props)

    // Subscribe to webhooks for this page
    await metaClient.subscribeToWebhooks(accessToken, pageId)

    // Set the pageId as the integration identifier
    await client.configureIntegration({
      identifier: pageId,
    })

    logger.forBot().info(`Successfully registered manual integration for page ${pageId}`)
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message, error)
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
  const metaClient = new MetaClient(logger)
  const credentials = await getMetaClientCredentials(client, ctx).catch(() => undefined)
  if (!credentials) {
    return
  }

  const { pageToken, pageId } = credentials
  if (await metaClient.isSubscribedToWebhooks(pageToken, pageId)) {
    await metaClient.unsubscribeFromWebhooks(pageToken, pageId)
  }
}

const _clearAllIdentifiers = async ({ client }: RegisterProps) => {
  await client.configureIntegration({
    identifier: null,
    sandboxIdentifiers: null,
  })
}
