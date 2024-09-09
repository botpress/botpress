import { boardmemberReadInputSchema } from 'src/schemas/actions/interfaces/boardmemberReadInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const boardmemberRead = wrapActionAndInjectServices<'boardmemberRead'>({
  async action({ input }, { memberRepository }) {
    const { id: memberIdOrUsername } = boardmemberReadInputSchema.parse(input)
    const item = await memberRepository.getMemberByIdOrUsername(memberIdOrUsername)

    return { item, meta: {} }
  },
  errorMessage: 'Failed to retrieve the board member',
})
