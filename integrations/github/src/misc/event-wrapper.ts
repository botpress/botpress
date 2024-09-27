import { User, WebhookEvent } from '@octokit/webhooks-types'
import { GitHubClient } from './github-client'
import { getOrCreateBotpressUserFromGithubUser } from './utils'
import * as bp from '.botpress'

type ExtraEventProps<E extends WebhookEvent> = {
  user: Awaited<ReturnType<typeof getOrCreateBotpressUserFromGithubUser>>
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

  const user = await getOrCreateBotpressUserFromGithubUser({ githubUser: githubEvent.sender, client })

  if (user.id === ctx.botUserId) {
    return
  }

  const getOctokit = async () => GitHubClient.create({ ctx, client })

  await fn({ ...props, user, getOctokit, githubEvent })
}

const _isValidSender = (event: WebhookEvent): event is WebhookEvent & { sender: User } =>
  'sender' in event && ['User', 'Organization'].includes(event.sender?.type ?? '')
