import type { HandlerProps } from '.botpress'
import { handleOauthRequest } from './api/auth'

const _isOauthRequest = ({ req }: HandlerProps) => req.path === '/oauth'

export const handler = async (props: HandlerProps) => {
  if (_isOauthRequest(props)) {
    await handleOauthRequest(props)
    return
  }

  // TODO: Add webhooks to handle external events
}
