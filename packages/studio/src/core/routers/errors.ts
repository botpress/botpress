import { ResponseError } from 'common/http'

export class InvalidOperationError extends ResponseError {
  constructor(message: string) {
    super('Invalid operation: ' + message, 400, 'BP_0006')
  }

  type = 'InvalidOperationError'
}

export class BadRequestError extends ResponseError {
  type = 'BadRequestError'

  constructor(message: string) {
    super(`Bad Request: ${message}`, 400, 'BP_0040')
    this.skipLogging = true
  }
}

export class UnauthorizedError extends ResponseError {
  type = 'UnauthorizedError'

  constructor(message: string) {
    super(`Unauthorized: ${message}`, 401, 'BP_0041')
  }
}

export class ForbiddenError extends ResponseError {
  type = 'ForbiddenError'

  constructor(message: string) {
    super(`Forbidden: ${message}`, 403, 'BP_0043')
  }
}

export class NotFoundError extends ResponseError {
  type = 'NotFoundError'

  constructor(message: string) {
    super(`Not Found: ${message}`, 404, 'BP_0044')
    this.skipLogging = true
  }
}

export class InternalServerError extends ResponseError {
  type = 'InternalServerError'

  constructor(message?: string) {
    super(message || '', 500, 'BP_0050')
  }
}
