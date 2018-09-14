export class Level {
  constructor(public name: string, public color: string) {}
}

export namespace Level {
  export const Info = new Level('info', 'green')
  export const Debug = new Level('debug', 'blue')
  export const Warn = new Level('warn', 'yellow')
  export const Error = new Level('error', 'red')
}

export class LogEntry {
  constructor(
    public botId: string,
    public level: string,
    public scope: string,
    public message: string,
    public metadata: any,
    public timestamp: string
  ) {}
}
