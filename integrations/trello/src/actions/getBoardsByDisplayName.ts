import { getBoardsByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getBoardsByDisplayName = wrapActionAndInjectServices<'getBoardsByDisplayName'>({
  async action({ input }, { boardQueryService }) {
    const { boardName } = getBoardsByDisplayNameInputSchema.parse(input)

    const matchingBoards = await boardQueryService.getBoardsByDisplayName(boardName)
    return { boards: matchingBoards }
  },
  errorMessage: 'Failed to retrieve the boards',
})
