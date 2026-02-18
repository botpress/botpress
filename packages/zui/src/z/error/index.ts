import { ZodParsedType } from '../types/utils'
import * as utils from '../utils'
import { errorMap as defaultErrorMap } from './locales/en'

export type ZodIssueBase = {
  path: (string | number)[]
  message?: string
}

export type ZodInvalidTypeIssue = {
  code: 'invalid_type'
  expected: ZodParsedType
  received: ZodParsedType
} & ZodIssueBase

export type ZodInvalidLiteralIssue = {
  code: 'invalid_literal'
  expected: unknown
  received: unknown
} & ZodIssueBase

export type ZodUnrecognizedKeysIssue = {
  code: 'unrecognized_keys'
  keys: string[]
} & ZodIssueBase

export type ZodInvalidUnionIssue = {
  code: 'invalid_union'
  unionErrors: ZodError[]
} & ZodIssueBase

export type ZodInvalidUnionDiscriminatorIssue = {
  code: 'invalid_union_discriminator'
  options: utils.types.Primitive[]
} & ZodIssueBase

export type ZodInvalidEnumValueIssue = {
  received: string | number
  code: 'invalid_enum_value'
  options: (string | number)[]
} & ZodIssueBase

export type ZodInvalidArgumentsIssue = {
  code: 'invalid_arguments'
  argumentsError: ZodError
} & ZodIssueBase

export type ZodInvalidReturnTypeIssue = {
  code: 'invalid_return_type'
  returnTypeError: ZodError
} & ZodIssueBase

export type ZodInvalidDateIssue = {
  code: 'invalid_date'
} & ZodIssueBase

export type StringValidation =
  | 'email'
  | 'url'
  | 'emoji'
  | 'uuid'
  | 'regex'
  | 'cuid'
  | 'cuid2'
  | 'ulid'
  | 'datetime'
  | 'ip'
  | { includes: string; position?: number }
  | { startsWith: string }
  | { endsWith: string }

export type ZodInvalidStringIssue = {
  code: 'invalid_string'
  validation: StringValidation
} & ZodIssueBase

export type ZodTooSmallIssue = {
  code: 'too_small'
  minimum: number | bigint
  inclusive: boolean
  exact?: boolean
  type: 'array' | 'string' | 'number' | 'set' | 'date' | 'bigint'
} & ZodIssueBase

export type ZodTooBigIssue = {
  code: 'too_big'
  maximum: number | bigint
  inclusive: boolean
  exact?: boolean
  type: 'array' | 'string' | 'number' | 'set' | 'date' | 'bigint'
} & ZodIssueBase

export type ZodInvalidIntersectionTypesIssue = {
  code: 'invalid_intersection_types'
} & ZodIssueBase

export type ZodNotMultipleOfIssue = {
  code: 'not_multiple_of'
  multipleOf: number | bigint
} & ZodIssueBase

export type ZodNotFiniteIssue = {
  code: 'not_finite'
} & ZodIssueBase

export type ZodUnresolvedReferenceIssue = {
  code: 'unresolved_reference'
} & ZodIssueBase

export type ZodCustomIssue = {
  code: 'custom'
  params?: { [k: string]: any }
} & ZodIssueBase

export type DenormalizedError = { [k: string]: DenormalizedError | string[] }

export type ZodIssueCode = ZodIssueOptionalMessage['code']
export type ZodIssueOptionalMessage =
  | ZodInvalidTypeIssue
  | ZodInvalidLiteralIssue
  | ZodUnrecognizedKeysIssue
  | ZodInvalidUnionIssue
  | ZodInvalidUnionDiscriminatorIssue
  | ZodInvalidEnumValueIssue
  | ZodInvalidArgumentsIssue
  | ZodInvalidReturnTypeIssue
  | ZodInvalidDateIssue
  | ZodInvalidStringIssue
  | ZodTooSmallIssue
  | ZodTooBigIssue
  | ZodInvalidIntersectionTypesIssue
  | ZodNotMultipleOfIssue
  | ZodNotFiniteIssue
  | ZodUnresolvedReferenceIssue
  | ZodCustomIssue

export type ZodIssue = ZodIssueOptionalMessage & {
  fatal?: boolean
  message: string
}

export const quotelessJson = (obj: any) => {
  const json = JSON.stringify(obj, null, 2)
  return json.replace(/"([^"]+)":/g, '$1:')
}

type recursiveZodFormattedError<T> = T extends [any, ...any[]]
  ? { [K in keyof T]?: ZodFormattedError<T[K]> }
  : T extends any[]
    ? { [k: number]: ZodFormattedError<T[number]> }
    : T extends object
      ? { [K in keyof T]?: ZodFormattedError<T[K]> }
      : unknown

export type ZodFormattedError<T, U = string> = {
  _errors: U[]
} & recursiveZodFormattedError<NonNullable<T>>

export class ZodError<T = any> extends Error {
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

  format(): ZodFormattedError<T>
  format<U>(mapper: (issue: ZodIssue) => U): ZodFormattedError<T, U>
  format(_mapper?: any) {
    const mapper: (issue: ZodIssue) => any =
      _mapper ||
      function (issue: ZodIssue) {
        return issue.message
      }
    const fieldErrors = { _errors: [] } as ZodFormattedError<T>
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
          let curr: any = fieldErrors
          let i = 0
          while (i < issue.path.length) {
            const el = issue.path[i]!
            const terminal = i === issue.path.length - 1

            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] }
              // if (typeof el === "string") {
              //   curr[el] = curr[el] || { _errors: [] };
              // } else if (typeof el === "number") {
              //   const errorArray: any = [];
              //   errorArray._errors = [];
              //   curr[el] = curr[el] || errorArray;
              // }
            } else {
              curr[el] = curr[el] || { _errors: [] }
              curr[el]._errors.push(mapper(issue))
            }

            curr = curr[el]
            i++
          }
        }
      }
    }

    processError(this)
    return fieldErrors
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

type stripPath<T extends object> = T extends any ? Omit<T, 'path'> : never

export type IssueData = stripPath<ZodIssueOptionalMessage> & {
  path?: (string | number)[]
  fatal?: boolean
}

export type ErrorMapCtx = {
  defaultError: string
  data: any
}

export type ZodErrorMap = (issue: ZodIssueOptionalMessage, _ctx: ErrorMapCtx) => { message: string }

let overrideErrorMap = defaultErrorMap
export { defaultErrorMap }

export function setErrorMap(map: ZodErrorMap) {
  overrideErrorMap = map
}

export function getErrorMap() {
  return overrideErrorMap
}
