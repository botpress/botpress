import { ApiActions } from './api'
import { CaseActions } from './cases'
import { ContactActions } from './contacts'
import { LeadActions } from './leads'
import * as bp from '.botpress'

export const actions = {
  ...ContactActions,
  ...LeadActions,
  ...ApiActions,
  ...CaseActions,
} satisfies bp.IntegrationProps['actions']
