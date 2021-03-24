import _ from 'lodash'

export interface ErrorMessage {
  message: string
  stack?: string
}

export function serializeError(err: any): ErrorMessage {
  if (err instanceof Error) {
    const { message, stack } = err
    return { message, stack }
  }

  if (_.isString(err)) {
    return { message: err }
  }

  if (_.isObject(err)) {
    return { message: JSON.stringify(err, null, 2) }
  }

  return { message: '' }
}

export function deserializeError(err: ErrorMessage): Error {
  const newErr = new Error(err.message)
  newErr.stack = err.stack
  return newErr
}
