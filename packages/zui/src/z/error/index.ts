import * as utils from '../../utils'
import type { ZodIssue, ZodFormattedError, ZodErrorMap, IZodError } from '../typings'
import { errorMap as defaultErrorMap } from './locales/en'

type _FieldErrors<U> = {
  _errors: U[]
} & {
  [K in string | number]: _FieldErrors<U> | unknown[]
}

export class ZodError<T = any> extends Error implements IZodError<T> {
  readonly __type__ = 'ZuiError'

  issues: ZodIssue[] = []

  get errors() {
    return this.issues
  }

  constructor(issues: ZodIssue[]) {
    super()

    const actualProto = new.target.prototype
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto)
    } else {
      ;(this as any).__proto__ = actualProto
    }
    this.name = 'ZodError'
    this.issues = issues
  }

  format(): ZodFormattedError<T, string>
  format<U>(mapper: (issue: ZodIssue) => U): ZodFormattedError<T, U>
  format<U>(_mapper?: (issue: ZodIssue) => U): ZodFormattedError<T, U> {
    const mapper: (issue: ZodIssue) => U =
      _mapper ||
      function (issue: ZodIssue) {
        return issue.message as U
      }
    const fieldErrors: _FieldErrors<U> = { _errors: [] }
    const processError = (error: ZodError) => {
      for (const issue of error.issues) {
        if (issue.code === 'invalid_union') {
          issue.unionErrors.map(processError)
        } else if (issue.code === 'invalid_return_type') {
          processError(issue.returnTypeError)
        } else if (issue.code === 'invalid_arguments') {
          processError(issue.argumentsError)
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue))
        } else {
          let curr = fieldErrors
          let i = 0
          while (i < issue.path.length) {
            const el = issue.path[i]!
            const terminal = i === issue.path.length - 1

            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] }
            } else {
              curr[el] = curr[el] || { _errors: [] }
              ;(curr[el] as _FieldErrors<U>)._errors.push(mapper(issue))
            }

            curr = curr[el] as _FieldErrors<U>
            i++
          }
        }
      }
    }

    processError(this)
    return fieldErrors as ZodFormattedError<T, U>
  }

  static create = (issues: ZodIssue[]) => {
    const error = new ZodError(issues)
    return error
  }

  static assert(value: unknown): asserts value is ZodError {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`)
    }
  }

  toString() {
    return this.message
  }
  get message() {
    return JSON.stringify(this.issues, utils.others.jsonStringifyReplacer, 2)
  }

  get isEmpty(): boolean {
    return this.issues.length === 0
  }

  addIssue = (sub: ZodIssue) => {
    this.issues = [...this.issues, sub]
  }

  addIssues = (subs: ZodIssue[] = []) => {
    this.issues = [...this.issues, ...subs]
  }
}

let overrideErrorMap = defaultErrorMap
export { defaultErrorMap }

export function setErrorMap(map: ZodErrorMap) {
  overrideErrorMap = map
}

export function getErrorMap() {
  return overrideErrorMap
}
