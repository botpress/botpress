export class ResponseError extends Error {
  code: string
  status: number

  constructor(message: string, status: number, code: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.status = status
    this.code = code
  }
}
