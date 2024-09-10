export class TrelloOperationError extends Error {
  public constructor(message: string, public originalError: unknown) {
    super(message)
    this.name = 'TrelloOperationError'
  }
}
