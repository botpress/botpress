export class ResponseError {
  message: string
  statusCode: number

  constructor(message?: string, statusCode?: number) {
    this.message = message
    this.statusCode = statusCode
  }
}

export class NotFoundError extends ResponseError {
  constructor(message?: string) {
    super(message, 404)
  }
}

export class UnprocessableEntityError extends ResponseError {
  constructor(message?: string) {
    super(message, 422)
  }
}

export class UnauthorizedError extends ResponseError {
  constructor(message?: string) {
    super(message, 403)
  }
}
