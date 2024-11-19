import { updateRefreshTokenFromAuthorizationCode } from './auth'
import { notificationSchema } from './schemas'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props
  if (req.path.startsWith('/oauth')) {
    return await handleOAuth(props)
  }

  const notifParseResult = notificationSchema.safeParse(req)
  if (!notifParseResult.success) {
    console.error('Invalid request:', notifParseResult.error)
    return {
      status: 400,
      body: 'Invalid request',
    }
  }
  // TODO: Handle notification
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
