import { updateRefreshTokenFromAuthorizationCode } from './auth'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props
  if (req.path.startsWith('/oauth')) {
    return await handleOAuth(props)
  }
}

export const handleOAuth = async ({ req, client, ctx }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    console.error('Error extracting code from url in OAuth handler')
    return
  }

  await updateRefreshTokenFromAuthorizationCode({ authorizationCode, client, ctx })
}
