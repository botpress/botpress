export type File = { path: string; content: string }

export type JSONSchema = Record<string, any>
export type AnyObject = Record<string, any>

export type ConfigurationDefinition = { schema: JSONSchema }
export type MessageDefinition = { schema: JSONSchema }
export type TagDefinition = { schema: JSONSchema }
export type ChannelDefinition = {
  messages?: Record<string, MessageDefinition>
  message?: {
    tags?: AnyObject
  }
  conversation?: {
    creation?: { enabled: boolean; requiredTags: string[] }
    tags?: AnyObject
  }
}
export type ActionDefinition = { input: { schema: JSONSchema }; output: { schema: JSONSchema } }
export type EventDefinition = { schema: JSONSchema }
