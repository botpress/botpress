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

  const userIdentity = await todoistClient.getAuthenticatedUserIdentity()

  client.configureIntegration({
    identifier: userIdentity.id,
  })

  await client.updateUser({
    id: ctx.botUserId,
    name: userIdentity.name,
    pictureUrl: userIdentity.pictureUrl,
    tags: {
      id: userIdentity.id,
    },
  })

  logger.forBot().info('Successfully authenticated with Todoist')
}
