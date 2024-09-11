import { wrapActionAndInjectServices } from 'src/utils'

export const getMemberByIdOrUsername = wrapActionAndInjectServices<'getMemberByIdOrUsername'>({
  async action({ input }, { memberRepository }) {
    const { memberIdOrUsername } = input

    const member = await memberRepository.getMemberByIdOrUsername(memberIdOrUsername)
    return { member }
  },
  errorMessage: 'Failed to retrieve the member',
})
