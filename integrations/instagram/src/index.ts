import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME } from 'integration.definition'
import actions from './actions'
import channels from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook'
import * as bp from '.botpress'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  key: bp.secrets.POSTHOG_KEY,
})
class InstagramIntegration extends bp.Integration {
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

export default new InstagramIntegration()
