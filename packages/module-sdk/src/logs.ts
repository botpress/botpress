export class Level {
  constructor(public name: string, public color: string) {}
}

export namespace Level {
  export const Info = new Level('info', 'green')
  export const Debug = new Level('debug', 'blue')
  export const Warn = new Level('warn', 'yellow')
  export const Error = new Level('error', 'red')
}

type LogEntryArgs = {
  botId?: string
  level: string
  scope: string
  message: string
  metadata: any
  timestamp: string
}
export class LogEntry {
  botId?: string
  level: string
  scope: string
  message: string
  metadata: any
  timestamp: string

  constructor(args: LogEntryArgs) {
    const { botId, level, scope, message, metadata, timestamp } = args
    this.botId = botId
    this.level = level
    this.scope = scope
    this.message = message
    this.metadata = metadata
    this.timestamp = timestamp
  }
}
