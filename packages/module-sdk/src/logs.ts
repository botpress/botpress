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
    this.botId = args.botId
    this.level = args.level
    this.scope = args.scope
    this.message = args.message
    this.metadata = args.metadata
    this.timestamp = args.timestamp
  }
}
