import { TodoistClient } from './todoist-api'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger, client, ctx }) => {
  logger.forBot().info('Registering Todoist integration')

  const todoistClient = await TodoistClient.create({ client, ctx })
  const userIdentity = await todoistClient.getAuthenticatedUserIdentity()

  await client.updateUser({
    id: ctx.botUserId,
    name: userIdentity.name,
    pictureUrl: userIdentity.pictureUrl,
    tags: { id: userIdentity.id },
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Unregistering Todoist integration')
}

export default {
  register,
  unregister,
}
