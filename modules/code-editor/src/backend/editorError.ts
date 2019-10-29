export class EditorError extends Error {
  errorCode: string
  statusCode: number

  constructor(message: string) {
    super(message)

    this.statusCode = 400
    this.errorCode = message
  }
}
