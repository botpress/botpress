import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getChannelsInfo = wrapActionAndInjectSlackClient(
  { actionName: 'getChannelsInfo', errorMessage: 'Failed to get channels info' },
  async ({ slackClient }, { cursor }) => {
    const { channels, nextCursor } = await slackClient.getChannelsInfo({ cursor })

    return {
      channels,
      nextCursor: nextCursor ?? '',
    }
  }
)
