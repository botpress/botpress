import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getChannelsInfo = wrapActionAndInjectSlackClient(
  { actionName: 'getChannelsInfo', errorMessage: 'Failed to get channels info' },
  async ({ slackClient }, { includeArchived, includePrivate, includeDm, cursor }) => {
    const { channels, nextCursor } = await slackClient.getChannelsInfo({
      includeArchived: includeArchived ?? false,
      includePrivate: includePrivate ?? false,
      includeDm: includeDm ?? false,
      cursor,
    })

    return {
      channels,
      nextCursor: nextCursor ?? '',
    }
  }
)
