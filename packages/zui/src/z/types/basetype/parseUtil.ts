import { defaultErrorMap, getErrorMap } from '../../error'
import type {
  ZodParsedType,
  IssueData,
  ZodIssue,
  ZodErrorMap,
  ParseContext,
  ParseInput,
  SyncParseReturnType,
  AsyncParseReturnType,
  ParseReturnType,
  InvalidParseReturnType,
  DirtyParseReturnType,
  ValidParseReturnType,
} from '../../typings'

export const makeIssue = (params: {
  data: any
  path: (string | number)[]
  errorMaps: ZodErrorMap[]
  issueData: IssueData
}): ZodIssue => {
  const { data, path, errorMaps, issueData } = params
  const fullPath = [...path, ...(issueData.path || [])]
  const fullIssue = {
    ...issueData,
    path: fullPath,
  }

  let errorMessage = ''
  const maps = errorMaps
    .filter((m) => !!m)
    .slice()
    .reverse() as ZodErrorMap[]
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message
  }

  return {
    ...issueData,
    path: fullPath,
    message: issueData.message ?? errorMessage,
  }
}

export type ParsePath = (string | number)[]
export const EMPTY_PATH: ParsePath = []

export type MergeObjectPair = {
  key: SyncParseReturnType<any>
  value: SyncParseReturnType<any>
  alwaysSet?: boolean
}

export function addIssueToContext(ctx: ParseContext, issueData: IssueData): void {
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap, // contextual error map is first priority
      ctx.schemaErrorMap, // then schema-bound map if available
      getErrorMap(), // then global override map
      defaultErrorMap, // then global default map
    ].filter((x) => !!x) as ZodErrorMap[],
  })
  ctx.common.issues.push(issue)
}

export type ObjectPair = {
  key: SyncParseReturnType<any>
  value: SyncParseReturnType<any>
}
export class ParseStatus {
  value: 'aborted' | 'dirty' | 'valid' = 'valid'
  dirty() {
    if (this.value === 'valid') this.value = 'dirty'
  }
  abort() {
    if (this.value !== 'aborted') this.value = 'aborted'
  }

  static mergeArray(status: ParseStatus, results: SyncParseReturnType<any>[]): SyncParseReturnType {
    const arrayValue: any[] = []
    for (const s of results) {
      if (s.status === 'aborted') return { status: 'aborted' }
      if (s.status === 'dirty') status.dirty()
      arrayValue.push(s.value)
    }

    return { status: status.value, value: arrayValue }
  }

  static async mergeObjectAsync(
    status: ParseStatus,
    pairs: { key: ParseReturnType<any>; value: ParseReturnType<any> }[]
  ): Promise<SyncParseReturnType<any>> {
    const syncPairs: ObjectPair[] = []
    for (const pair of pairs) {
      syncPairs.push({
        key: await pair.key,
        value: await pair.value,
      })
    }
    return ParseStatus.mergeObjectSync(status, syncPairs)
  }

  static mergeObjectSync(status: ParseStatus, pairs: MergeObjectPair[]): SyncParseReturnType {
    const finalObject: Record<string, unknown> = {}
    for (const pair of pairs) {
      const { key, value } = pair
      if (key.status === 'aborted') return { status: 'aborted' }
      if (value.status === 'aborted') return { status: 'aborted' }
      if (key.status === 'dirty') status.dirty()
      if (value.status === 'dirty') status.dirty()

      if (key.value !== '__proto__' && (typeof value.value !== 'undefined' || pair.alwaysSet)) {
        finalObject[key.value] = value.value
      }
    }

    return { status: status.value, value: finalObject }
  }
}

export const isAborted = (x: ParseReturnType<any>): x is InvalidParseReturnType =>
  (x as SyncParseReturnType).status === 'aborted'
export const isDirty = <T>(x: ParseReturnType<T>): x is ValidParseReturnType<T> | DirtyParseReturnType<T> =>
  (x as SyncParseReturnType).status === 'dirty'
export const isValid = <T>(x: ParseReturnType<T>): x is ValidParseReturnType<T> =>
  (x as SyncParseReturnType).status === 'valid'
export const isAsync = <T>(x: ParseReturnType<T>): x is AsyncParseReturnType<T> =>
  typeof Promise !== 'undefined' && x instanceof Promise

export const getParsedType = (data: any): ZodParsedType => {
  const t = typeof data

  switch (t) {
    case 'undefined':
      return 'undefined'

    case 'string':
      return 'string'

    case 'number':
      return isNaN(data) ? 'nan' : 'number'

    case 'boolean':
      return 'boolean'

    case 'function':
      return 'function'

    case 'bigint':
      return 'bigint'

    case 'symbol':
      return 'symbol'

    case 'object':
      if (Array.isArray(data)) {
        return 'array'
      }
      if (data === null) {
        return 'null'
      }
      if (data.then && typeof data.then === 'function' && data.catch && typeof data.catch === 'function') {
        return 'promise'
      }
      if (typeof Map !== 'undefined' && data instanceof Map) {
        return 'map'
      }
      if (typeof Set !== 'undefined' && data instanceof Set) {
        return 'set'
      }
      if (typeof Date !== 'undefined' && data instanceof Date) {
        return 'date'
      }
      return 'object'

    default:
      return 'unknown'
  }
}

export class ParseInputLazyPath implements ParseInput {
  parent: ParseContext
  data: any
  _path: ParsePath
  _key: string | number | (string | number)[]
  _cachedPath: ParsePath = []
  constructor(parent: ParseContext, value: any, path: ParsePath, key: string | number | (string | number)[]) {
    this.parent = parent
    this.data = value
    this._path = path
    this._key = key
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key)
      } else {
        this._cachedPath.push(...this._path, this._key)
      }
    }

    return this._cachedPath
  }
}
