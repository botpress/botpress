import { RuntimeError } from '@botpress/sdk'
import { getMetaClientCredentials } from './misc/auth'
import { FacebookClient } from './misc/facebook-client'

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

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  await _clearAllIdentifiers(props)
  await _unsubscribeFromOAuthWebhooks(props)
}

const _registerManual = async (props: RegisterProps, config: ManualConfig) => {
  const { client, logger } = props
  logger.forBot().debug('Registering manual')

  const { pageId, accessToken } = config

  if (!accessToken || !pageId) {
    throw new RuntimeError('Missing access token or page ID')
  }

  try {
    const facebookClient = new FacebookClient({ accessToken, pageId }, logger)

    await _clearAllIdentifiers(props)
    await facebookClient.subscribeToWebhooks(pageId)

    await client.configureIntegration({
      identifier: pageId,
    })

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

const _registerOAuth = async ({ client, ctx, logger }: RegisterProps) => {
  // Only remove sandbox identifiers
  await client.configureIntegration({
    sandboxIdentifiers: null,
  })

  // Subscribe to webhooks through OAuth configuration
  try {
    const credentials = await getMetaClientCredentials(client, ctx)

    logger.forBot().debug(`Credentials: ${JSON.stringify(credentials, null, 2)}`)

    if (credentials) {
      const { pageToken, pageId } = credentials
      const facebookClient = new FacebookClient({ accessToken: pageToken, pageId }, logger)

      if (!(await facebookClient.isSubscribedToWebhooks(pageId))) {
        await facebookClient.subscribeToWebhooks(pageId)
        logger.forBot().info(`Successfully subscribed to webhooks for OAuth page ${pageId}`)
      } else {
        logger.forBot().info(`Already subscribed to webhooks for OAuth page ${pageId}`)
      }
    }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to subscribe to webhooks for OAuth: ' + error.message, error)
  }
}

const _unsubscribeFromOAuthWebhooks = async ({ ctx, logger, client }: RegisterProps) => {
  const credentials = await getMetaClientCredentials(client, ctx).catch(() => undefined)
  if (!credentials) {
    return
  }

  const { pageToken, pageId } = credentials
  const facebookClient = new FacebookClient({ accessToken: pageToken, pageId }, logger)
  if (await facebookClient.isSubscribedToWebhooks(pageId)) {
    await facebookClient.unsubscribeFromWebhooks(pageId)
  }
}

const _clearAllIdentifiers = async ({ client }: RegisterProps) => {
  await client.configureIntegration({
    identifier: null,
    sandboxIdentifiers: null,
  })
}
