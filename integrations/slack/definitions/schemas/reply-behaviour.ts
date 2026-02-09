import { z } from '@botpress/sdk'

export const channelMentionSchema = z
  .enum(['required', 'notRequired'])
  .title('Channel Mention Required')
  .describe('Whether the bot requires an @mention to reply in channels')
export const threadMentionSchema = z
  .enum(['required', 'inherit', 'notRequired'])
  .title('Thread Mention Required')
  .describe(
    'Whether the bot requires an @mention to reply in threads: required, inherit (reply if bot was mentioned in parent), or notRequired'
  )
export const channelReplyLocationSchema = z
  .enum(['channel', 'thread', 'both'])
  .title('Channel Reply Location')
  .describe('Where the bot should reply to channel messages: channel, thread, or both')
export const dmReplyLocationSchema = z
  .enum(['dm', 'thread', 'both'])
  .title('DM Reply Location')
  .describe('Where the bot should reply to DM messages: dm, thread, or both')

export const replyBehaviourSchema = z
  .object({
    channelMention: channelMentionSchema,
    threadMention: threadMentionSchema,
    channelReplyLocation: channelReplyLocationSchema,
    dmReplyLocation: dmReplyLocationSchema,
  })
  .title('Reply Behaviour')
  .describe('How the bot should reply to messages')

export type ChannelMention = z.infer<typeof channelMentionSchema>
export type ThreadMention = z.infer<typeof threadMentionSchema>
export type ChannelReplyLocation = z.infer<typeof channelReplyLocationSchema>
export type DmReplyLocation = z.infer<typeof dmReplyLocationSchema>
export type ReplyBehaviour = z.infer<typeof replyBehaviourSchema>
