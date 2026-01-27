import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { createPost, deletePost } from './actions'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const config: posthogHelper.PostHogConfig = {
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
}

const props: bp.IntegrationProps = {
  register,
  unregister,
  handler,
  actions: {
    createPost,
    deletePost,
  },
  channels: {},
}

export default posthogHelper.wrapIntegration(config, props)
