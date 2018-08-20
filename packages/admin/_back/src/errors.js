export class ResponseError extends Error {
  constructor(message, status, code) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.code = code
    this.status = status
  }
}

export class AssertionError extends ResponseError {
  constructor(message) {
    super('Invalid payload: ' + message, 400, 'BPC_0003')
  }

  type = 'AssertionError'
}

export class ProcessingError extends ResponseError {
  constructor(message) {
    super('Error processing the request: ' + message, 500, 'BP_0004')
  }

  type = 'ProcessingError'
}

export class UnauthorizedAccessError extends ResponseError {
  constructor(message) {
    super('Unauthorized: ' + message, 400, 'BP_0005')
  }

  type = 'UnauthorizedAccessError'
}

export class InvalidOperationError extends ResponseError {
  constructor(message) {
    super('Invalid operation: ' + message, 400, 'BP_0006')
  }

  type = 'InvalidOperatonError'
}

export class NotFoundError extends ResponseError {
  constructor(message) {
    super('Not Found: ' + message, 400, 'BP_0007')
  }

  type = 'NotFoundError'
}

export class TokenExpiredError extends ResponseError {
  constructor(message) {
    super('Authentication token expired: ' + message, 400, 'BP_0008')
  }

  type = 'TokenExpiredError'
}

export class InvalidCredentialsError extends ResponseError {
  constructor() {
    super('Invalid credentials', 400, 'BPC_0009')
  }

  type = 'InvalidCredentialsError'
}
