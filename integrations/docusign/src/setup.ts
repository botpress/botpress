import { refreshAccountState } from './docusign-api/auth-utils'
import { cleanupWebhooks, refreshWebhooks } from './docusign-api/utils'
import * as bp from '.botpress'

export const register: bp.Integration['register'] = async (props) => {
  await refreshAccountState(props)
  await refreshWebhooks(props, props.webhookUrl)
}

export const unregister: bp.Integration['unregister'] = async (props) => {
  await cleanupWebhooks(props, props.webhookUrl)
}
