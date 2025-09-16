import * as personActions from './person'
import * as dealActions from './deal'
import * as leadActions from './lead'
import * as activityActions from './activity'
import * as bp from '.botpress'

export default {
  ...personActions,
  ...dealActions,
  ...leadActions,
  ...activityActions
} as const satisfies bp.IntegrationProps['actions']