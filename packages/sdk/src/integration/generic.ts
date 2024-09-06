export type BaseIntegration = {
  name: string
  version: string
  configuration: any
  configurations: Record<string, any>
  actions: Record<string, Record<'input' | 'output', any>>
  channels: Record<
    string,
    {
      messages: Record<string, any>
      message: {
        tags: Record<string, any>
      }
      conversation: {
        tags: Record<string, any>
        creation: {
          enabled: boolean
          requiredTags: string[]
        }
      }
    }
  >
  events: Record<string, any>
  states: Record<string, any>
  user: {
    tags: Record<string, any>
    creation: {
      enabled: boolean
      requiredTags: string[]
    }
  }
  entities: Record<string, any>
}
