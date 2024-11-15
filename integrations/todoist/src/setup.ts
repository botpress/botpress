import * as bp from '.botpress'
import { TodoistClient } from './todoist-api'

export const register: bp.IntegrationProps['register'] = async ({ logger, client, ctx }) => {
  logger.forBot().info('Registering Todoist integration')

  const todoistClient = await TodoistClient.create({ client, ctx })
  const userId = await todoistClient.getAuthenticatedUserId()

  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'configuration',
    payload: {
      botUserId: userId,
    },
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Unregistering Todoist integration')
}

export default {
  register,
  unregister,
}
