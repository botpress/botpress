import { posthogHelper } from '@botpress/common'
import actions from './actions'
import channels from './channels'
import { INTEGRATION_NAME } from './const'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  key: bp.secrets.POSTHOG_KEY,
})
class GithubIntegration extends bp.Integration {
  public constructor() {
    super({
      register,
      unregister,
      actions,
      channels,
      handler,
    })
  }
}

export default new GithubIntegration()
