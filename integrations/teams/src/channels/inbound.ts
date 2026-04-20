import { Activity, ConversationReference, TurnContext, TeamsInfo, TeamsChannelAccount } from 'botbuilder'
import { transformTeamsHtmlToStdMarkdown } from '../markdown/teams-html-to-markdown'
import { getAdapter, sleep } from '../utils'
import { DROPDOWN_VALUE_ID, DROPDOWN_VALUE_KIND } from './constants'
import * as bp from '.botpress'

export const processInboundChannelMessage = async ({ client, ctx, logger }: bp.HandlerProps, activity: Activity) => {
  const convRef: Partial<ConversationReference> = TurnContext.getConversationReference(activity)

  const senderChannelAccount = activity.from!
  const adapter = getAdapter(ctx.configuration)

  const getUserPromise = new Promise<TeamsChannelAccount | undefined>((resolve, reject) => {
    void adapter
      .continueConversation(convRef, async (tc) => {
        const user = await TeamsInfo.getMember(tc, senderChannelAccount.id)
        resolve(user)
      })
      .then(() => resolve(undefined))
      .catch(reject)
  })

  const sender = await Promise.race([getUserPromise, sleep(2000)])
  if (sender?.email) {
    logger.forBot().info(`Received request from user: ${sender.email}`)
  }

  switch (activity.type) {
    case 'message':
      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          id: activity.conversation.id,
        },
      })

      await client.setState({
        id: conversation.id,
        name: 'conversation',
        type: 'conversation',
        payload: convRef,
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          id: activity.from.id,
          email: sender?.email,
        },
      })

      const message = _extractMessage(activity)
      await client.getOrCreateMessage({
        tags: { id: activity.id },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: message },
      })
      break
    default:
      return
  }
}

const _extractMessage = (activity: Activity): string => {
  // Handle dropdown value
  if (activity.value && activity.value.kind === DROPDOWN_VALUE_KIND) {
    return String(activity.value[DROPDOWN_VALUE_ID])
  }

  // Handle HTML attachment (Any richtext/markdown will convert/show up as HTML)
  if (activity.attachments) {
    const htmlAttachment = activity.attachments.find((attachment) => attachment.contentType === 'text/html')
    if (htmlAttachment && typeof htmlAttachment.content === 'string') {
      return transformTeamsHtmlToStdMarkdown(htmlAttachment.content)
    }
  }

  /** Fallback to plain text
   *
   *  @remark Using coalescence operator (??) since messages
   *   with no text can happen (e.g. image only messages) */
  return activity.text ?? ''
}
