import * as personActions from './person'
import * as bp from '.botpress'

export default {
  ...personActions,
} as const satisfies bp.IntegrationProps['actions']
