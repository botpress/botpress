import { cardCreateInputSchema } from 'src/schemas/actions/interfaces/cardCreateInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const cardCreate = wrapActionAndInjectServices<'cardCreate'>({
  async action({ input }, { cardRepository }) {
    const { name, description, listId } = cardCreateInputSchema.parse(input).item

    const item = await cardRepository.createCard({
      name,
      description: description ?? '',
      listId,
    })

    return { item, meta: {} }
  },
  errorMessage: 'Failed to create the card',
})
