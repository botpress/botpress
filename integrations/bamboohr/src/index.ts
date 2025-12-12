import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { actions } from './actions'
import { handler } from './handler'
import { register, unregister } from './setup'

import * as bp from '.botpress'
@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
})
class BambooHrIntegration extends bp.Integration {
  public constructor() {
    super({
      register,
      unregister,
      actions,
      channels: {},
      handler,
    })
  }
}

export default new BambooHrIntegration()
