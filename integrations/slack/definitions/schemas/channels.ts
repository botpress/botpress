import { z } from '@botpress/sdk'

export const channelTypeSchema = z
  .enum(['channel', 'dm', 'thread'])
  .title('Channel Type')
  .describe('The slack channel type (channel, dm, or thread)')

export const channelReplyLocationSchema = z
  .enum(['channel', 'thread', 'channelAndThread'])
  .title('Channel Reply Location')
  .describe(
    'Where the bot should reply to channel messages: channel, thread, or channelAndThread (reply in channel and thread)'
  )

export type ChannelType = z.infer<typeof channelTypeSchema>
export type ChannelReplyLocation = z.infer<typeof channelReplyLocationSchema>
