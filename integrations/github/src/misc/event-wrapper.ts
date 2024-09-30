import { User, WebhookEvent } from '@octokit/webhooks-types'
import { GitHubClient } from './github-client'
import * as bp from '.botpress'

type GitHubUser = {
  login: string
  avatar_url: string
  html_url: string
  node_id: string
  id: number
}
type ExtraEventProps<E extends WebhookEvent> = {
  user: Awaited<ReturnType<typeof _getOrCreateBotpressUserFromGithubUser>>
  getOctokit: () => Promise<GitHubClient>
  githubEvent: E
}
type IncomingEventProps<E extends WebhookEvent> = bp.HandlerProps & { githubEvent: E }
type WrapEventFunction = <E extends WebhookEvent>(
  fn: (props: IncomingEventProps<E> & ExtraEventProps<E>) => Promise<void>
) => (props: IncomingEventProps<E>) => Promise<void>

export const wrapEvent: WrapEventFunction = (fn) => async (props) => {
  const { client, githubEvent, ctx } = props

  if (!_isValidSender(githubEvent)) {
    return
  }

  const user = await _getOrCreateBotpressUserFromGithubUser({ githubUser: githubEvent.sender, client })

  if (user.id === ctx.botUserId) {
    return
  }

  const getOctokit = async () => GitHubClient.create({ ctx, client })

  await fn({ ...props, user, getOctokit, githubEvent })
}

const _isValidSender = (event: WebhookEvent): event is WebhookEvent & { sender: User } =>
  'sender' in event && ['User', 'Organization'].includes(event.sender?.type ?? '')

const _getOrCreateBotpressUserFromGithubUser = async ({
  githubUser,
  client,
}: {
  githubUser: GitHubUser
  client: bp.Client
}) => {
  const { users } = await client.listUsers({
    tags: {
      nodeId: githubUser.node_id,
    },
  })

  if (users.length && users[0]) {
    return users[0]
  }

  const { user } = await client.createUser({
    name: githubUser.login,
    pictureUrl: githubUser.avatar_url,
    tags: {
      handle: githubUser.login,
      nodeId: githubUser.node_id,
      id: githubUser.id.toString(),
      profileUrl: githubUser.html_url,
    },
  })

  return user
}
