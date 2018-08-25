export type ChannelUserAttribute = { key: string; value: string; type: string }

export type ChannelUser = {
  userId: string
  channelName: string
  createdOn: Date
  attributes?: ChannelUserAttribute[]
  otherChannels?: ChannelUser[]
}
