import { RuntimeError } from '@botpress/sdk'
import { getAuthenticatedIntercomClient } from '../auth'
import * as bp from '.botpress'

export const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async (props) => {
  const { client, ctx, input } = props
  const { id: userId } = input.user
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }

  const intercomClient = await getAuthenticatedIntercomClient(client, ctx)
  const { id, email } = await intercomClient.contacts.find({ id: userId })
  if (!id || !email) {
    throw new RuntimeError('User not found')
  }

  const { user } = await client.getOrCreateUser({ tags: { id, email }, discriminateByTags: ['id'] })
  return { userId: user.id }
}
