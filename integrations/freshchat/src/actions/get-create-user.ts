import { getFreshchatClient } from 'src/client'
import { ActionGetCreateUser } from '../schemas'

export const getCreateUser: ActionGetCreateUser = async ({ ctx, input, client }) => {

  const freshchatClient = getFreshchatClient(ctx.configuration)

  let freshchatUser = await freshchatClient.getUserByEmail(input.email)

  if(!freshchatUser) {
    console.log(`User with email ${input.email} not Found, creating a new one`)

    freshchatUser = await freshchatClient.createUser({
      email: input.email,
      first_name: input.email,
      reference_id: input.email
    })
  }

  console.log('got freshchat user', freshchatUser)

  const botpressUser = await client.getOrCreateUser({
    tags: {
      freshchatUserId: freshchatUser.id
    }
  })

  console.log('will return ', { ...botpressUser.user, freshchat: freshchatUser })

  return { ...botpressUser.user, freshchat: freshchatUser }
}
