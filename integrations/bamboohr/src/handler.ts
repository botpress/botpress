import { handleOauthRequest } from './api/auth'

import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  if (_isOauthRequest(props)) {
    await handleOauthRequest(props)
    return
  }

  // TODO: Add webhooks to handle external events
}
