import { cardReadInputSchema } from 'src/schemas/actions/interfaces/cardReadInputSchema'
import * as bp from '../../../.botpress'
import { wrapWithTryCatch } from '../../utils'
import { getCardById } from '../getCardById'

const cardRead: bp.IntegrationProps['actions']['cardRead'] = async ({ ctx, input, client, logger }) => {
  const { id: cardId } = cardReadInputSchema.parse(input)
  const { card: item } = await getCardById({ ctx, input: { cardId }, client, logger, type: 'getCardById' })

  return { item, meta: {} }
}

const wrapped = wrapWithTryCatch(cardRead, 'Failed to retrieve the cards')
export { wrapped as cardRead }
