import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const createTicket: bp.IntegrationProps['actions']['createTicket'] = async () => {
  throw new RuntimeError('Not implemented yet')
}
