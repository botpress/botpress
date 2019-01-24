/**
 * The object that wraps HTTP errors.
 *
 * @constructor
 * @param message - The error message that will be sent to the end-user
 * @param statusCode - The HTTP status code
 * @param errorCode - Botpress error codes e.g. BP_0001, BP_0002, etc.
 */
export class ResponseError extends Error {
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

export class ConflictError extends ResponseError {
  type = 'ConflictError'

  constructor(message?: string) {
    super(`Conflict: ${message}`, 409, 'BP_0012')
    this.skipLogging = true
  }
}
