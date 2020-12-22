export class EditorError extends Error {
  errorCode: string
  statusCode: number
  details: string

  constructor(message: string, details?: string) {
    super(message)

    this.statusCode = 400
    this.message = message
    this.details = details
  }
}
