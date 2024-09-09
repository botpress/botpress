import { getCardMembersInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getCardMembers = wrapActionAndInjectServices<'getCardMembers'>({
  async action({ input }, { cardRepository }) {
    const { cardId } = getCardMembersInputSchema.parse(input)
    const members = await cardRepository.getCardMembers(cardId)

    return { members }
  },
  errorMessage: 'Failed to retrieve the members of the card',
})
