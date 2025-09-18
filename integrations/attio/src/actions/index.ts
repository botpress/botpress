import * as recordActions from './record'
import * as bp from '.botpress'

export default { ...recordActions } as const satisfies bp.IntegrationProps['actions']