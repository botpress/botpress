import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const posthogConfig: posthogHelper.PostHogConfig = {
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
}

const integrationConfig: bp.IntegrationProps = {
  register,
  unregister,
  actions,
  channels,
  handler,
}

export default posthogHelper.wrapIntegration(posthogConfig, integrationConfig)
