import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { TodoistClient } from 'src/todoist-api'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  try {
    const searchParams = new URLSearchParams(req.query)
    const error = searchParams.get('error')
    if (error) {
      throw new Error(`${error} - ${searchParams.get('error_description') ?? ''}`)
    }

    const authorizationCode = searchParams.get('code')
    if (!authorizationCode) {
      throw new Error('Authorization code not present in OAuth callback')
    }

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const errorMessage = 'OAuth error: ' + msg
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}
