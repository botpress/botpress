import { updateRefreshTokenFromAuthorizationCode } from './client'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
    const { req } = props
    if(req.path.startsWith('/oauth')) {
       return await handleOAuth(props)
    }

    return { status: 404 } // TODO: Nothing by default?
}

export const handleOAuth = async ({ req, client, ctx }: bp.HandlerProps) => {
    const searchParams = new URLSearchParams(req.query)
    const authorizationCode = searchParams.get('code')

    if (!authorizationCode) {
      console.error('Error extracting code from url')
      return
    }

    await updateRefreshTokenFromAuthorizationCode({ authorizationCode, client, ctx })
}
