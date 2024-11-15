import { TodoistClient } from 'src/todoist-api'
import * as bp from '.botpress'

export const oauthCallbackHandler = async ({ client, ctx, req, logger }: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(req.query)
  const authorizationCode = searchParams.get('code')

  if (!authorizationCode) {
    return
  }

  await TodoistClient.authenticateWithAuthorizationCode({
    client,
    ctx,
    authorizationCode,
  })

  const todoistClient = await TodoistClient.create({ client, ctx })

  const userId = await todoistClient.getAuthenticatedUserId()
  client.configureIntegration({
    identifier: userId,
  })

  await client.updateUser({
    id: ctx.botUserId,
    tags: {
      id: userId,
    },
  })

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      botUserId: userId,
    },
  })

  logger.forBot().info('Successfully authenticated with Todoist')
}
