import { cardmemberListInputSchema } from 'src/schemas/actions/interfaces/cardmemberListInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const cardmemberList = wrapActionAndInjectServices<'cardmemberList'>({
  async action({ input }, { cardRepository }) {
    const { nextToken: cardId } = cardmemberListInputSchema.parse(input)
    const items = await cardRepository.getCardMembers(cardId)

    return { items, meta: {} }
  },
  errorMessage: 'Failed to retrieve the card members',
})
