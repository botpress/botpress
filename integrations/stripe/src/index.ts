import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import actions from './actions'
import { oauthWizardHandler } from './oauth-wizard'
import { register, unregister, handler } from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler: async (props) => {
    if (isOAuthWizardUrl(props.req.path)) {
      return await oauthWizardHandler(props)
    }
    return await handler(props)
  },
})
