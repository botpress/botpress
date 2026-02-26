import { z } from '@botpress/sdk'

export const channelTypeValues = ['channel', 'dm', 'thread'] as const
export const findTargetChannelValues = ['channel', 'dm'] as const

export const channelTypeSchema = z
  .enum(channelTypeValues)
  .title('Channel Type')
  .describe('The slack channel type (channel, dm, or thread)')

// TODO: Re-allow "thread" in findTarget output when bumping integration major version to 5.0.0.
export const findTargetChannelSchema = z
  .enum(findTargetChannelValues)
  .title('Channel Type')
  .describe('The type of channel of the target')

export const channelReplyLocationSchema = z
  .enum(['channel', 'thread', 'channelAndThread'])
  .title('Channel Reply Location')
  .describe(
    'Where the bot should reply to channel messages: channel, thread, or channelAndThread (reply in channel and thread)'
  )

export type ChannelType = z.infer<typeof channelTypeSchema>
export type FindTargetChannelType = z.infer<typeof findTargetChannelSchema>
export type ChannelReplyLocation = z.infer<typeof channelReplyLocationSchema>
