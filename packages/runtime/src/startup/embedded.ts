import sdk from 'botpress/sdk'
import { EventEmitter2 } from 'eventemitter2'
import { RuntimeConfig } from '../runtime/config/runtime.config'

export interface BotpressRuntime {
  /** process.MESSAGING_ENDPOINT and process.NLU_ENDPOINT must be set at this time */
  initExternalServices: () => Promise<void>

  bots: {
    mount: (botId: string) => Promise<boolean>
    unmount: (botId: string) => Promise<void>
  }

  /** Messaging has a new converse, but this is to keep the previous feature working like before */
  sendConverseMessage: (
    botId: string,
    userId: string,
    payload: any,
    credentials?: any,
    includedContexts?: string[]
  ) => Promise<any>

  /** These namespaces are provided as-is to be used by the server */
  events: typeof sdk.events
  dialog: typeof sdk.dialog
  users: typeof sdk.users
}

export interface RuntimeSetup {
  /** The directory where the data folder is located */
  rootDir: string
  /** If no configuration is provided, it will try to load botpress.config.json from the root directory */
  config?: RuntimeConfig
  clients?: {
    /** Use an already configured client (avoids doubling the number of clients/pools) */
    knex?: sdk.KnexExtended
  }
  endpoints?: {
    nlu: string
    messaging: string
  }
  /** Provide additional methods to the base API provided by the runtime */
  apiExtension?: any
  logger?: {
    emitter?: EventEmitter2
  }
  httpServer?: any
}
