import { posthogHelper } from '@botpress/common'
import actions from './actions'
import channels from './channels'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from './const'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const integrationConfig: bp.IntegrationProps = {
  register,
  unregister,
  actions,
  channels,
  handler,
}

export default posthogHelper.wrapIntegration(
  {
    integrationName: INTEGRATION_NAME,
    key: bp.secrets.POSTHOG_KEY,
    integrationVersion: INTEGRATION_VERSION,
  },
  integrationConfig
)
