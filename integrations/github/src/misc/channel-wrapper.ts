import * as sdk from '@botpress/sdk'
import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'

type Channels = {
  [K in keyof bp.IntegrationProps['channels']]: bp.IntegrationProps['channels'][K]['messages']
}
export type ChannelInjections = { owner: string; repo: string; octokit: GitHubClient }
type ChannelKey = keyof Channels
type MessageType<C extends ChannelKey> = keyof Channels[C]
type BaseChannelParams<C extends ChannelKey, T extends MessageType<C>> = Parameters<Channels[C][T]>[0]
type ChannelParamsWithInjections<C extends ChannelKey, T extends MessageType<C>> = BaseChannelParams<C, T> &
  ChannelInjections
type WrapChannelFunction = <C extends ChannelKey, T extends MessageType<C> = 'text'>(
  channelName: C,
  impl: {
    channel: (props: ChannelParamsWithInjections<C, T>) => Promise<void>
  }
) => (props: BaseChannelParams<C, T>) => any

export const wrapChannelAndInjectOctokit: WrapChannelFunction =
  (channelName, { channel }) =>
  async (props) => {
    const { ctx, client, conversation } = props
    const octokit = await GitHubClient.create({ ctx, client })
    const owner = await GithubSettings.getOrganizationHandle({ ctx, client })
    const repo = conversation.tags.repoName

    if (!repo) {
      throw new Error('Missing repoName tag')
    }

    return _tryCatch(() => {
      props.logger
        .forBot()
        .debug(`Sending message in channel "${channelName}" for owner "${owner}" [bot id: ${props.ctx.botId}]`)

      return channel({ ...props, owner, repo, octokit })
    }, `Failed to send a message in channel "${channelName}"`)
  }

const _tryCatch = async <T>(fn: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await fn()
  } catch (thrown: unknown) {
    console.error(`Channel Error: ${errorMessage}`, thrown)
    throw new sdk.RuntimeError(errorMessage)
  }
}
