import { TodoistClient } from 'src/todoist-api'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const error = searchParams.get('error')
  if (error) {
    const errorMsg = `OAuth error: ${error} - ${searchParams.get('error_description') ?? ''}`
    logger.forBot().error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    const errorMsg = 'Authorization code not present in OAuth callback'
    logger.forBot().error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  try {
    await TodoistClient.authenticateWithAuthorizationCode({
      client,
      ctx,
      authorizationCode,
    })

    const todoistClient = await TodoistClient.create({ client, ctx })

    const userIdentity = await todoistClient.getAuthenticatedUserIdentity()

    await client.configureIntegration({
      identifier: userIdentity.id,
    })

    await client.updateUser({
      id: ctx.botUserId,
      name: userIdentity.name,
      pictureUrl: userIdentity.pictureUrl,
      tags: {
        id: userIdentity.id,
      },
    })

    logger.forBot().info('Successfully authenticated with Todoist')
    return generateRedirection(getInterstitialUrl(true))
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.forBot().error(`Failed to process OAuth callback: ${errorMsg}`)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }
}
