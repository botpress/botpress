import * as agentActions from './agent'
import * as bp from '.botpress'

export default {
  ...agentActions,
} as const satisfies bp.IntegrationProps['actions']
