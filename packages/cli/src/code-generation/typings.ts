export type File = { path: string; content: string }

export type JSONSchema = Record<string, any>
export type ConfigurationDefinition = { schema: JSONSchema }
export type MessageDefinition = { schema: JSONSchema }
export type ChannelDefinition = { messages?: Record<string, MessageDefinition> }
export type ActionDefinition = { input: { schema: JSONSchema }; output: { schema: JSONSchema } }
export type EventDefinition = { schema: JSONSchema }
