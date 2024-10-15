import { createChannelWrapper } from '@botpress/common'
import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'
import { wrapWithTryCatch } from './error-handling'

export type ChannelProps = Parameters<Parameters<typeof _wrapChannelAndInjectTools>[2]>[0]

export const wrapChannelAndInjectOctokit: typeof _wrapChannelAndInjectTools = (channelName, messageType, channelImpl) =>
  _wrapChannelAndInjectTools(channelName, messageType, (props) =>
    wrapWithTryCatch(async () => {
      props.logger
        .forBot()
        .debug(`Sending message in channel "${channelName}" for owner "${props.owner}" [bot id: ${props.ctx.botId}]`)

      await channelImpl(props as Parameters<typeof channelImpl>[0])
    }, `Channel Error: Failed to send a message in channel "${channelName}"`)()
  )

const _wrapChannelAndInjectTools = createChannelWrapper<bp.IntegrationProps>()({
  octokit: ({ ctx, client }) => GitHubClient.create({ ctx, client }),
  owner: ({ ctx, client }) => GithubSettings.getOrganizationHandle({ ctx, client }),
  repo({ conversation }) {
    const repo = conversation.tags.repoName

    if (!repo) {
      throw new Error('Missing repoName tag')
    }

    return repo
  },
})
