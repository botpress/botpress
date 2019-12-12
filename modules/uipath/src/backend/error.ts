class ResponseError extends Error {
  errorCode: string
  statusCode: number

  skipLogging = false

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

export class UnauthorizedError extends ResponseError {
  type = 'UnauthorizedError'

  constructor(message: string) {
    super(`Unauthorized: ${message}`, 401, 'BP_0041')
  }
}
