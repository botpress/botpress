import { DatabaseConfig } from './database.config'

export type BotpressConfig = {
  httpServer: {
    /** BP_HTTP_HOST */
    host: string | null
    port: number
    backlog: number
  }
  database: DatabaseConfig
}
