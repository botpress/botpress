import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { actions } from './actions'
import { channels } from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

export const posthogConfig: posthogHelper.PostHogConfig = {
  integrationName: INTEGRATION_NAME,
  key: bp.secrets.POSTHOG_KEY,
  integrationVersion: INTEGRATION_VERSION,
}
const integrationConfig: bp.IntegrationProps = {
  register,
  unregister,
  actions,
  channels,
  handler,
}

export default posthogHelper.wrapIntegration(posthogConfig, integrationConfig)
