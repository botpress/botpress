import * as errors from '../gen/errors'

export class IdAlreadyAssignedError extends errors.InternalError {
  public constructor(id: string) {
    super(`The id "${id}" is already assigned to another value`)
  }
}
