export class ProcessingError extends Error {
  constructor(
    message: string,
    public readonly botId: string,
    public readonly nodeName: string,
    public readonly flowName: string,
    public readonly instruction: string
  ) {
    super(message)
  }
}

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
    public readonly flowName?: string,
    public readonly nodeName?: string
  ) {
    super(`${message}, Bot: ${botId}, Flow: ${flowName || 'N/A'}, Node: ${nodeName || 'N/A'}`)
  }
}

export class InfiniteLoopError extends FlowError {
  constructor(
    public recurringPath: string[],
    public readonly botId: string,
    public readonly flowName?: string,
    public readonly nodeName?: string
  ) {
    super(`Infinite loop detected. (${recurringPath.join(' --> ')})`, botId, flowName, nodeName)
  }
}

export class TimeoutNodeNotFound extends Error {
  constructor(message: string) {
    super(message)
  }
}
