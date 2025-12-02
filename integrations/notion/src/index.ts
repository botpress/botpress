import { actions } from './actions'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'
import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
  additionalProperties: (props) => ({
    configurationType: props?.ctx?.configurationType,
    integrationId: props?.ctx?.integrationId,
  }),
})

class NotionIntegration extends bp.Integration {
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

export default new NotionIntegration()
