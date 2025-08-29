import { searchContact } from './searchContact'
import * as bp from '.botpress'

export default {
  searchContact,
} as const satisfies bp.IntegrationProps['actions']
