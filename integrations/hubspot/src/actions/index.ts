import * as contactActions from './contact'
import * as dealActions from './deal'
import * as leadActions from './lead'
import * as bp from '.botpress'

export default {
  ...contactActions,
  ...dealActions,
  ...leadActions,
} as const satisfies bp.IntegrationProps['actions']
