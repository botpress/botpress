import { RuntimeError } from '@botpress/sdk'
import { getOAuthMetaClientCredentials } from './misc/auth'
import { createAuthenticatedMetaClient } from './misc/meta-client'

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
  await _clearAllIdentifiers(props)
  await _unsubscribeFromOAuthWebhooks(props)
}

const _registerSandbox = async (props: RegisterProps) => {
  await _clearAllIdentifiers(props)
  await _unsubscribeFromOAuthWebhooks(props)
}

const _registerOAuth = async (props: RegisterProps) => {
  const { client } = props

  // Only remove sandbox identifiers
  await client.configureIntegration({
    sandboxIdentifiers: null,
  })

  // Verify OAuth credentials and check if reauthorization is needed
  await _verifyOAuthCredentials(props)
}

const _verifyOAuthCredentials = async (props: RegisterProps) => {
  const { client, ctx, logger } = props
  const reauthorizeMessage = 'Authentication failed. Please reauthorize.'
  const credentials = await getOAuthMetaClientCredentials(client, ctx).catch(() => undefined)

  const handleAuthFailure = async (logMessage: string, logLevel: 'warn' | 'error' = 'warn') => {
    logger.forBot()[logLevel](logMessage)
    await _clearAllIdentifiers(props)
    throw new RuntimeError(reauthorizeMessage)
  }

  if (!credentials) {
    await handleAuthFailure('OAuth credentials not found. Please reauthorize.', 'error')
  }

  // Verify the oauth state
  if (!credentials?.pageToken || !credentials?.pageId) {
    await handleAuthFailure('OAuth flow not completed yet. Please reauthorize.', 'error')
  }

  // Verify that we can make an authenticated request to the Meta API
  try {
    const metaClient = await createAuthenticatedMetaClient({
      configType: 'oauth',
      ctx,
      client,
      logger,
    })

    const pageId = credentials?.pageId
    const isSubscribedToWebhooks = await metaClient.isSubscribedToWebhooks(pageId)

    if (!isSubscribedToWebhooks) {
      await handleAuthFailure('OAuth credentials verified. No webhooks subscribed.', 'warn')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await handleAuthFailure(`Error verifying OAuth credentials: ${errorMessage}`, 'error')
  }
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
  const isSubscribedToWebhooks = await metaClient.isSubscribedToWebhooks(pageId)
  if (!isSubscribedToWebhooks) {
    logger.forBot().info(`No webhooks subscribed to for page ${pageId}. Skipping unsubscription.`)
    return
  }
  await metaClient.unsubscribeFromWebhooks(pageId)
}

const _clearAllIdentifiers = async ({ client }: RegisterProps) => {
  await client.configureIntegration({
    identifier: null,
    sandboxIdentifiers: null,
  })
}
