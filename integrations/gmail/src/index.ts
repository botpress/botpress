import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { actions } from './actions'
import { channels } from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

export const posthogConfig = {
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
}
@posthogHelper.wrapIntegration(posthogConfig)
class GmailIntegration extends bp.Integration {
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

export default new GmailIntegration()
