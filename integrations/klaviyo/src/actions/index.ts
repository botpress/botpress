import * as profileActions from './profile'
import * as listActions from './list'
import * as bp from '.botpress'

export default {
  ...profileActions,
  ...listActions,
} as const satisfies bp.IntegrationProps['actions']
