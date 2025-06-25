import { ErrorResponse } from 'resend'

export class ResendError extends Error {
  public constructor(errorResp: ErrorResponse) {
    super(errorResp.message)
    this.name = errorResp.name
  }
}
