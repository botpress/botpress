import { User as GitHubSender, WebhookEvent } from '@octokit/webhooks-types'
import { User } from 'src/definitions/entities'
import { mapping } from './entity-mapping'
import { GitHubClient } from './github-client'
import * as bp from '.botpress'

type ExtraEventProps<E extends WebhookEvent> = {
  githubEvent: E
  getOctokit: () => Promise<GitHubClient>
  mapping: ReturnType<typeof mapping>
  eventSender: User
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

  const mappingHelper = mapping(client)
  const eventSender = await mappingHelper.mapUser(githubEvent.sender)

  if (eventSender.botpressUser === ctx.botUserId) {
    return
  }

  const getOctokit = async () => GitHubClient.create({ ctx, client })

  await fn({ ...props, eventSender, getOctokit, githubEvent, mapping: mappingHelper })
}

const _isValidSender = (event: WebhookEvent): event is WebhookEvent & { sender: GitHubSender } =>
  'sender' in event && ['User', 'Organization'].includes(event.sender?.type ?? '')
