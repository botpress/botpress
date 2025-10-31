import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

const getOrCreateUser: bp.IntegrationProps['actions']['getOrCreateUser'] = async ({ client, ctx, input }) => {
  if (ctx.configurationType === 'sandbox') {
    throw new RuntimeError('Creating a user is not supported in sandbox mode')
  }

  const userId = input.user.id
  if (!userId) {
    throw new RuntimeError('User ID is required')
  }

  const { user } = await client.getOrCreateUser({
    tags: {
      usrId: userId,
    },
  })

  return {
    userId: user.id,
  }
}

export default getOrCreateUser
