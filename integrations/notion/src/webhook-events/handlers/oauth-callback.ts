import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { NotionClient } from '../../notion-api'
import * as bp from '.botpress'

export const isOAuthCallback = (props: bp.HandlerProps): boolean => props.req.path.startsWith('/oauth')

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ client, ctx, req, logger }) => {
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

    const { workspaceId } = await NotionClient.processAuthorizationCode({ client, ctx }, authorizationCode)

    await client.configureIntegration({
      identifier: workspaceId,
    })

    return generateRedirection(getInterstitialUrl(true))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const errorMessage = 'OAuth error: ' + msg
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}
