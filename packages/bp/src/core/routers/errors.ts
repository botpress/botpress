import { ResponseError } from 'common/http'
import { getErrorMessage } from 'common/utils'

export class InvalidOperationError extends ResponseError {
  constructor(message: unknown) {
    super(`Invalid operation: ${getErrorMessage(message)}`, 400, 'BP_0006')
  }

  type = 'InvalidOperationError'
}

export class BadRequestError extends ResponseError {
  type = 'BadRequestError'

  constructor(message: unknown) {
    super(`Bad Request: ${getErrorMessage(message)}`, 400, 'BP_0040')
    this.skipLogging = true
  }
}

export class NotReadyError extends ResponseError {
  type = 'NotReadyError'

  constructor(service: unknown) {
    super(`Service Not Ready: ${getErrorMessage(service)}`, 400, 'BP_0140')
    this.skipLogging = true
  }
}

export class UnauthorizedError extends ResponseError {
  type = 'UnauthorizedError'

  constructor(message: unknown) {
    super(`Unauthorized: ${getErrorMessage(message)}`, 401, 'BP_0041')
  }
}

export class PaymentRequiredError extends ResponseError {
  type = 'PaymentRequiredError'

  constructor(message: unknown) {
    super(getErrorMessage(message), 402, 'BP_0042')
  }
}

export class ForbiddenError extends ResponseError {
  type = 'ForbiddenError'

  constructor(message: unknown) {
    super(`Forbidden: ${getErrorMessage(message)}`, 403, 'BP_0043')
  }
}

export class NotFoundError extends ResponseError {
  type = 'NotFoundError'

  constructor(message: unknown) {
    super(`Not Found: ${getErrorMessage(message)}`, 404, 'BP_0044')
    this.skipLogging = true
  }
}

export class ConflictError extends ResponseError {
  type = 'ConflictError'

  constructor(message?: unknown) {
    super(`Conflict: ${getErrorMessage(message)}`, 409, 'BP_0049')
    this.skipLogging = true
  }
}

export class InternalServerError extends ResponseError {
  type = 'InternalServerError'

  constructor(message?: unknown) {
    super(getErrorMessage(message), 500, 'BP_0050')
  }
}

export class InvalidExternalToken extends ResponseError {
  type = 'InvalidExternalToken'

  constructor(message: unknown) {
    super(`Unauthorized: ${getErrorMessage(message)}`, 401, 'BP_0401')
    this.skipLogging = true
  }
}
