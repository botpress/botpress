import { z } from '@botpress/sdk'

export const channelTypeSchema = z
  .enum(['channel', 'dm', 'dmThread', 'thread'])
  .title('Channel Type')
  .describe('The slack channel type (channel, dm, dmThread, or thread)')

export type ChannelType = z.infer<typeof channelTypeSchema>
