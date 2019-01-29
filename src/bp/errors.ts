import { VError } from 'verror'

export class FatalError extends VError {}
export class ValidationError extends VError {}
export class ConfigurationError extends VError {}
export class InvalidParameterError extends VError {}
export class UnlicensedError extends VError {}

export function WrapErrorsWith(message: string) {
  return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    if (descriptor.value != undefined) {
      descriptor.value = getNewFunction(descriptor.value, message)
    } else if (descriptor.get != undefined) {
      descriptor.get = getNewFunction(descriptor.get, message)
    } else {
      throw 'Only put a WrapErrorsWith() decorator on a method or get accessor.'
    }
  }
}

function getNewFunction(originalMethod: Function, message: string) {
  return function(this: any, ...args: any[]) {
    try {
      const ret = originalMethod.apply(this, args)
      if (ret && typeof ret.catch === 'function') {
        return ret.catch(err => {
          throw new VError(err, message)
        })
      }
      return ret
    } catch (err) {
      throw new VError(err, message)
    }
  }
}
