import { ResponseError } from 'common/http'

export class InvalidCredentialsError extends ResponseError {
  constructor(message?: string) {
    super('Invalid credentials' + (message ? ' ' + message : ''), 400, 'BP_0009')
    this.skipLogging = true
  }

  type = 'InvalidCredentialsError'
}

export class LockedOutError extends ResponseError {
  constructor(message?: string) {
    super('Account locked out' + (message ? ' ' + message : ''), 400, 'BP_0011')
    this.skipLogging = true
  }

  type = 'LockedOutError'
}

export class WeakPasswordError extends ResponseError {
  constructor(message?: string) {
    super("Password doesn't match policy" + (message ? ' ' + message : ''), 400, 'BP_0012')
    this.skipLogging = true
  }

  type = 'WeakPasswordError'
}

export class PasswordExpiredError extends ResponseError {
  constructor(message?: string) {
    super('Password Expired' + (message ? ' ' + message : ''), 400, 'BP_0010')
    this.skipLogging = true
  }

  type = 'PasswordExpiredError'
}
