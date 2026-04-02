import { NotionClient } from '../../notion-api'
import * as bp from '.botpress'

export const isOAuthCallback = (props: bp.HandlerProps): boolean => props.req.path.startsWith('/oauth')

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ client, ctx, req }) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    console.error('Error extracting code from url')
    return
  }

  const { workspaceId } = await NotionClient.processAuthorizationCode({ client, ctx }, authorizationCode)

  await client.configureIntegration({
    identifier: workspaceId,
  })
}
