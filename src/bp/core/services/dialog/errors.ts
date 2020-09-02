export class ActionExecutionError extends Error {
  private hideStack = false
  constructor(
    public readonly internalMessage: string,
    public readonly actionName: string,
    public readonly stacktrace: string
  ) {
    super(internalMessage)
  }
}

export class BPError extends Error {
  private hideStack = true
  constructor(message: string, private code) {
    super(message)
  }
}

export class FlowError extends Error {
  constructor(
    message: string,
    public readonly botId: string,
    public readonly flowName: string,
    public readonly nodeName?: string
  ) {
    super(`${message}, Bot: ${botId}, Flow: ${flowName || 'N/A'}, Node: ${nodeName || 'N/A'}`)
  }
}

export class TimeoutNodeNotFound extends Error {
  constructor(message: string) {
    super(message)
  }
}
