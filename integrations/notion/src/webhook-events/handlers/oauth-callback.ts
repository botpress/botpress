import { NotionClient } from '../../notion-api'
import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'

export const isOAuthCallback = (props: bp.HandlerProps): boolean => props.req.path.startsWith('/oauth')

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ client, ctx, req }) => {
  const searchParams = new URLSearchParams(req.query)
  const error = searchParams.get('error')
  if (error) {
    const errorMsg = `OAuth error: ${error} - ${searchParams.get('error_description') ?? ''}`
    console.error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    const errorMsg = 'Authorization code not present in OAuth callback'
    console.error(errorMsg)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }

  try {
    const { workspaceId } = await NotionClient.processAuthorizationCode({ client, ctx }, authorizationCode)

    await client.configureIntegration({
      identifier: workspaceId,
    })

    return generateRedirection(getInterstitialUrl(true))
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`Failed to process OAuth callback: ${errorMsg}`)
    return generateRedirection(getInterstitialUrl(false, errorMsg))
  }
}
