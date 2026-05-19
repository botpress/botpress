import * as actions from 'src/actions'
import * as bp from '.botpress'
import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { oauthWizardHandler } from './oauth-wizard'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels: {},
  handler: async (props) => {
    if (isOAuthWizardUrl(props.req.path)) {
      return await oauthWizardHandler(props)
    }

    return
  },
})
