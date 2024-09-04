import { IMemberQueryService } from 'src/interfaces/services/IMemberQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getMemberByIdOrUsernameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getMemberByIdOrUsername: bp.IntegrationProps['actions']['getMemberByIdOrUsername'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const memberQueryService = container.resolve<IMemberQueryService>(DIToken.MemberQueryService)
  const { memberIdOrUsername } = getMemberByIdOrUsernameInputSchema.parse(input)

  const member = await memberQueryService.getMemberByIdOrUsername(memberIdOrUsername)
  return { member }
}

export default wrapWithTryCatch(getMemberByIdOrUsername, 'Failed to retrieve the member')
