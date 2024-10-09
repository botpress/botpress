import * as sdk from '@botpress/sdk'
import { User as GitHubSender, WebhookEvent } from '@octokit/webhooks-types'
import { User } from 'src/definitions/entities'
import { mapping } from './entity-mapping'
import * as bp from '.botpress'

type ExtraEventProps<E extends WebhookEvent> = {
  githubEvent: E
  mapping: ReturnType<typeof mapping>
  eventSender: User
}
type IncomingEventProps<E extends WebhookEvent> = bp.HandlerProps & { githubEvent: E }
type WrapEventFunction = <E extends WebhookEvent>(impl: {
  event: (props: IncomingEventProps<E> & ExtraEventProps<E>) => Promise<void>
  errorMessage: string
}) => (props: IncomingEventProps<E>) => Promise<void>

export const wrapEvent: WrapEventFunction =
  ({ event, errorMessage }) =>
  async (props) => {
    const { client, githubEvent, ctx } = props

    if (!_isValidSender(githubEvent)) {
      return
    }

    const mappingHelper = mapping(client)
    const eventSender = await mappingHelper.mapUser(githubEvent.sender)

    if (eventSender.botpressUser === ctx.botUserId) {
      return
    }

    return _tryCatch(() => event({ ...props, eventSender, githubEvent, mapping: mappingHelper }), errorMessage)
  }

const _isValidSender = (event: WebhookEvent): event is WebhookEvent & { sender: GitHubSender } =>
  'sender' in event && ['User', 'Organization'].includes(event.sender?.type ?? '')

const _tryCatch = async <T>(fn: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await fn()
  } catch (thrown: unknown) {
    console.error(`Event Handler Error: ${errorMessage}`, thrown)
    throw new sdk.RuntimeError(errorMessage)
  }
}
