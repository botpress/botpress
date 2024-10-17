import { handleIncomingEmail } from './new-mail'
import { handleOAuthCallback } from './oauth-callback'
import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps) => {
  console.info('handler received a request')

  if (props.req.path.startsWith('/oauth')) {
    return handleOAuthCallback(props)
  }

  await handleIncomingEmail(props)
}
