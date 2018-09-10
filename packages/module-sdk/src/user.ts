export type ChannelUserAttribute = { key: string; value: string; type: string }

export type ChannelUserAttributes = ChannelUserAttribute[] & {
  get(key: string): string | undefined
}

export type ChannelUser = {
  id: string
  channel: string
  createdOn: Date
  updatedOn: Date
  attributes: ChannelUserAttributes
  otherChannels?: ChannelUser[]
}
