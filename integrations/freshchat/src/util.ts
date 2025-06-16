import * as bp from '../.botpress'
import { getFreshchatClient } from './client'

type IntegrationUser = Awaited<ReturnType<bp.Client['getUser']>>['user']

export const updateAgentUser = async (
  user: IntegrationUser,
  client: bp.Client,
  ctx: bp.Context,
  logger: bp.Logger,
  forceUpdate?: boolean
): Promise<{ updatedAgentUser: IntegrationUser }> => {
  if (!forceUpdate && user?.name?.length) {
    return { updatedAgentUser: user }
  }

  let updatedFields: any = {}

  try {
    const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)
    const agentData = await freshchatClient.getAgentById(user.tags.id as string)
    updatedFields = {
      name: agentData?.first_name + ' ' + agentData?.last_name,
      pictureUrl: agentData?.avatar?.url,
    }
  } catch (e: any) {
    logger.forBot().error(`Couldn't get the agent profile from Freshchat: ${e.message}`)
  }

  if (!updatedFields?.pictureUrl?.length && ctx.configuration?.agentAvatarUrl?.length) {
    updatedFields.pictureUrl = ctx.configuration.agentAvatarUrl
  }

  if (updatedFields.name !== user.name || updatedFields.pictureUrl !== user.pictureUrl) {
    const { user: updatedUser } = await client.updateUser({
      ...user,
      ...updatedFields,
    })
    return { updatedAgentUser: updatedUser }
  }

  return { updatedAgentUser: user }
}
