export interface Config {
  /**
   * @param agentSessionTimeout Once an agent becomes inactive, how long before automatically switching the agent to offline. - refer to https://www.npmjs.com/package/ms for options
   * @default 10m
   */
  agentSessionTimeout: string

  /**
   * @param autoComplete
   */
  autoComplete?: IAutoComplete

  /**
   * @param messageCount Number of messages to display in the conversation history
   * @default 10
   */
  messageCount: number

  /**
   * @param handoffAlert Amount of time in minutes before an unassigned handoff turns yellow.
   * @default 5
   */
  handoffAlert?: number

  /**
   * @param defaultUsername Whether or not to display a random username for anonymous users
   * @default false
   */
  defaultUsername: boolean

  /**
   * @param botAvatarUrl Image url you want to display as avatar when an agent takes control
   */
  botAvatarUrl?: string

  /**
   * @param tags List of tags that a handoff can be associated with
   * @default []
   */
  tags?: string[]

  /**
   * @param enableConversationDeletion Whether or not to allow the agent to delete the user conversation
   * @default false
   */
  enableConversationDeletion: boolean

  /**
   * @param transferMessage The message sent to the user when he is being transferred to an agent. E.g. ̀`{ "lang": "message"}`.
   * @default { "en": "You are being transferred to an agent.", "fr": "Vous êtes transféré à un agent.", "es": "Se le está transfiriendo a un agente."}
   */
  transferMessage: {
    [Key: string]: string
  }

  /**
   * @param assignMessage The message sent to the user when he has been assigned to an agent.
   * @argument agentName It is possible to specify the agent name as an argument to the message. See the example below.
   * @default { "en": "You have been assigned to our agent {{agentName}}.", "fr": "Vous avez été assigné à notre agent(e) {{agentName}}.", "es": "Ha sido asignado al agente {{agentName}}."}
   */
  assignMessage: {
    [Key: string]: string
  }

  /**
   * @param eventsWebHook
   * @default {}
   */
  eventsWebHook?: Webhook
}

export interface IShortcut {
  name: string
  value: string
}

export interface IAutoComplete {
  /**
   * @param trigger
   * @default :
   */
  trigger: string

  /**
   * @param shortcuts
   * @default []
   * @example [{ "name": "hello", "value": "Hello friend!" }]
   */
  shortcuts: IShortcut[]
}

export interface Webhook {
  /**
   * @param url
   * @example "https://myapplicationserver.com/webhook-handler"
   */
  url?: string
  /**
   * @param headers
   * @example { "authorization": "Baerer ..." }
   */
  headers?: { [name: string]: string }
}
