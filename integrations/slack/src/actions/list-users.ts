import { isApiError } from '@botpress/client'
import { WebClient } from '@slack/web-api'
import { Member } from '@slack/web-api/dist/response/UsersListResponse'
import { mapKeys, isEqual } from 'lodash'
import { getAccessToken } from 'src/misc/utils'
import * as botpress from '.botpress'

const syncSlackUserToBotpressUser = async (member: Member, botpressClient: botpress.Client) => {
  try {
    const { user } = await botpressClient.getOrCreateUser({
      tags: {
        id: member.id,
      },
    })

    const latestTags = mapKeys(user.tags, (v, k) => k.split(':')[1])
    const tags = { ...member.profile }

    if (isEqual(latestTags, tags)) {
      return user
    }

    const { user: updatedUser } = await botpressClient.updateUser({
      name: member.name,
      pictureUrl: member.profile?.image_512,
      tags,
    } as any)

    return updatedUser
  } catch (err) {
    if (isApiError(err) && err.type === 'RateLimited') {
      await new Promise((resolve) => setTimeout(resolve, 10 * 1000))
      await syncSlackUserToBotpressUser(member, botpressClient)
    }
  }
}

export const listActiveMembers: botpress.IntegrationProps['actions']['listActiveMembers'] = async ({
  client: botpressClient,
  ctx,
}) => {
  const accessToken = await getAccessToken(botpressClient, ctx)
  const client = new WebClient(accessToken)
  const slackMembers: Member[] = []

  const getAllMembers = async (cursor?: string) => {
    const res = await client.users.list({ cursor })
    slackMembers.push(...(res.members || []).filter((x) => !x.deleted))

    if (res.response_metadata?.next_cursor) {
      await getAllMembers(res.response_metadata.next_cursor)
    }
  }
  await getAllMembers()

  const users = []
  for (const slackMember of slackMembers) {
    const user = await syncSlackUserToBotpressUser(slackMember, botpressClient)
    users.push(user)
  }

  return { users }
}
