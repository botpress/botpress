import * as bp from '../../../.botpress'
import { boardmemberRead } from './boardmemberRead'

export const cardmemberRead: bp.IntegrationProps['actions']['cardmemberRead'] = ({ ctx, input, client, logger }) =>
  boardmemberRead({ ctx, input: { id: input.id }, client, logger, type: 'boardmemberRead' })
