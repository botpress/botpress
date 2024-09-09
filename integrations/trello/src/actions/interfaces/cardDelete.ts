import { cardReadInputSchema } from 'src/schemas/actions/interfaces/cardReadInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const cardDelete = wrapActionAndInjectServices<'cardDelete'>({
  async action({ input }, { cardRepository }) {
    const { id: cardId } = cardReadInputSchema.parse(input)
    const card = await cardRepository.getCardById(cardId)

    await cardRepository.updateCard({ ...card, isClosed: true })

    return { item: { ...card, isClosed: true }, meta: {} }
  },
  errorMessage: 'Failed to archive the card',
})
