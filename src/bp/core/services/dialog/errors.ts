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
