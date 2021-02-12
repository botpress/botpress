import { VError } from 'verror'

export class FatalError extends VError {}
export class ValidationError extends VError {}
export class ConfigurationError extends VError {}
export class InvalidParameterError extends VError {}
export class UnlicensedError extends VError {}

export type MessageFn = (args: any[]) => string
export interface ErrorOptions {
  hideStackTrace: boolean
}

export const DefaultErrorOptions: ErrorOptions = {
  hideStackTrace: false
}

export function WrapErrorsWith(message: string | MessageFn, options: ErrorOptions = DefaultErrorOptions) {
  return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    if (descriptor.value != null) {
      descriptor.value = getNewFunction(descriptor.value, message, options)
    } else if (descriptor.get != null) {
      descriptor.get = getNewFunction(descriptor.get, message, options)
    } else {
      throw 'Only put a WrapErrorsWith() decorator on a method or get accessor.'
    }
  }
}

function getNewFunction(originalMethod: Function, message: string | MessageFn, options: ErrorOptions) {
  return function(this: any, ...args: any[]) {
    const msg = typeof message === 'string' ? message : message(args)
    const genError = err => {
      const verr = new VError(err, msg)
      verr['__hideStackTrace'] = options.hideStackTrace
      return verr
    }
    try {
      const ret = originalMethod.apply(this, args)
      if (ret && typeof ret.catch === 'function') {
        return ret.catch(err => {
          throw genError(err)
        })
      }
      return ret
    } catch (err) {
      throw genError(err)
    }
  }
}
