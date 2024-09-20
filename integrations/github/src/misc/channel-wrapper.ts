import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'

export type ExtraChannelProps = {
  owner: string
  repo: string
  octokit: GitHubClient
}
type ChannelKey = keyof bp.MessageProps
type MessageType<C extends ChannelKey> = keyof bp.MessageProps[C]
type WrapChannelFunction = <C extends ChannelKey, T extends MessageType<C> = 'text'>(
  fn: (props: bp.MessageProps[C][T] & ExtraChannelProps) => Promise<void>
) => (props: bp.MessageProps[C][T]) => Promise<void>

export const wrapChannel: WrapChannelFunction = (fn) => async (props) => {
  const { ctx, client, conversation } = props
  const octokit = await GitHubClient.create({ ctx, client })
  const owner = await GithubSettings.getOrganizationHandle({ ctx, client })
  const repo = conversation.tags.repoName

  if (!repo) {
    throw new Error('Missing repoName tag')
  }

  await fn({ ...props, owner, repo, octokit })
}
