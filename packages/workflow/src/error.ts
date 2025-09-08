export class AbortError extends Error {
  public isWorkflowError = true
  public type = 'abort'
}
export class FailedError extends Error {
  public isWorkflowError = true
  public type = 'failed'
}
export class UnexpectedError extends Error {
  public isWorkflowError = true
  public type = 'unexpected'
}

export const isWorkflowError = (error: unknown): error is AbortError | FailedError | UnexpectedError =>
  !!error &&
  typeof error === 'object' &&
  'isWorkflowError' in error &&
  typeof error.isWorkflowError === 'boolean' &&
  error.isWorkflowError === true
