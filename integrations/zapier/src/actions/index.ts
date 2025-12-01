import { trigger } from './implementations/trigger'
import * as bp from '.botpress'

export const actions = {
  trigger,
} as const satisfies bp.IntegrationProps['actions']
