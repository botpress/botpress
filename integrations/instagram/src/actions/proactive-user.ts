import { getCredentials, InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const credentials = await getCredentials(client, ctx)
  const metaClient = new InstagramClient(logger, credentials)
  const profile = await metaClient.getUserProfile(input.user.id)
  const { user } = await client.getOrCreateUser({ tags: { id: profile.id } })
  return { userId: user.id }
}
