export type Attribute = { key: string; value: string; type: string }

export type AttributeMap = Attribute[] & {
  get(key: string): string | undefined
}

export type User = {
  id: string
  channel: string
  createdOn: Date
  updatedOn: Date
  attributes: AttributeMap
  otherChannels?: User[]
}
