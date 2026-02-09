import { z } from '@botpress/sdk'
import { channelReplyLocationSchema } from './channels'

export const replyBehaviourSchema = z
  .object({
    location: channelReplyLocationSchema
      .default('channel')
      .title('Reply Location')
      .describe('Where the bot sends replies: Channel only, Thread only (creates if needed), or both'),
    onlyOnBotMention: z
      .boolean()
      .default(false)
      .title('Require Bot Mention for Replies')
      .describe('This ensures that the bot only replies to messages when it is explicitly mentioned'),
  })
  .title('Reply Behaviour')
  .describe('How the bot should reply to messages')

export type ReplyBehaviour = z.infer<typeof replyBehaviourSchema>
