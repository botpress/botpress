import * as profileActions from './profile'
import * as bp from '.botpress'

export default {
  ...profileActions,
} as const satisfies bp.IntegrationProps['actions']
