import { createChannelWrapper } from '@botpress/common'
import { wrapAsyncFnWithTryCatch } from './error-handling'
import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'

export type ChannelProps = Parameters<Parameters<typeof _wrapChannelAndInjectTools>[1]>[0]

export const wrapChannelAndInjectOctokit: typeof _wrapChannelAndInjectTools = (meta, channelImpl) =>
  _wrapChannelAndInjectTools(meta, (props) =>
    wrapAsyncFnWithTryCatch(async () => {
      props.logger
        .forBot()
        .debug(
          `Sending message in channel "${meta.channelName}" for owner "${props.owner}" [bot id: ${props.ctx.botId}]`
        )

      await channelImpl(props as Parameters<typeof channelImpl>[0])
    }, `Channel Error: Failed to send a ${meta.messageType} message in channel "${meta.channelName}"`)()
  )

const _wrapChannelAndInjectTools = createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    octokit: ({ ctx, client }) => GitHubClient.create({ ctx, client }),
    owner: ({ ctx, client }) => GithubSettings.getOrganizationHandle({ ctx, client }),
    repo({ conversation }) {
      const repo = conversation.tags.repoName

      if (!repo) {
        throw new Error('Missing repoName tag')
      }

      return repo
    },
  },
})
