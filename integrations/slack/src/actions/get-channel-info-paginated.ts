import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getChannelInfoPaginated = wrapActionAndInjectSlackClient(
  { actionName: 'getChannelInfoPaginated', errorMessage: 'Failed to retrieve channel info' },
  async ({ slackClient }, { channelName, nextToken }) => {
    const result = await slackClient.getChannelInfoPaginated({ channelName, nextToken })

    if (result.channel) {
      return {
        found: true,
        id: result.channel.id,
        name: result.channel.name,
        isPrivate: result.channel.is_private,
        isArchived: result.channel.is_archived,
        topic: result.channel.topic?.value,
        purpose: result.channel.purpose?.value,
        numMembers: result.channel.num_members,
        nextCursor: result.nextCursor,
      }
    }

    return {
      found: false,
      nextCursor: result.nextCursor,
    }
  }
)
