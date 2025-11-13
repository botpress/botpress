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


const _verifyOAuthCredentials = async ({ client, ctx, logger }: RegisterProps) => {
  const reauthorizeMessage = 'Authentication failed. Please reauthorize.'
  const { state } = await client
    .getState({
      type: 'integration',
      name: 'oauth',
      id: ctx.integrationId,
    })
    .catch(() => ({ state: undefined }))
  
  // Verify the oauth state 
  if (!state?.payload.accessToken) {
    const message = 'OAuth flow not completed yet. Please reauthorize.'
    logger.forBot().warn(message)
    throw new RuntimeError(reauthorizeMessage)
  }

  if (!state?.payload.pageToken) {
    const message = 'OAuth flow incomplete: Missing page token. Please reauthorize.'
    logger.forBot().error(message)
    throw new RuntimeError(reauthorizeMessage)
  }

  // Verify that we can make an authenticated request to the Meta API
  try {
    const metaClient = await createAuthenticatedMetaClient({ 
      configType: 'oauth', 
      ctx, 
      client, 
      logger 
    })
    
    const pageId = state.payload.pageId
    const isSubscribed = await metaClient.isSubscribedToWebhooks(pageId)
    
    logger.forBot().info(`OAuth credentials verified. Webhook subscription status: ${isSubscribed ? 'active' : 'inactive'}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Error verifying OAuth credentials: ${errorMessage}`)
    throw new RuntimeError(reauthorizeMessage)
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