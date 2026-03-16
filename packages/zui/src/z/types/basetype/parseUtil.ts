import { defaultErrorMap, getErrorMap } from '../../error'
import type {
  ZodParsedType,
  EffectIssue,
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
  issueData: EffectIssue
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

type _ParsePath = (string | number)[]
type _ObjectPair = {
  key: SyncParseReturnType
  value: SyncParseReturnType
}

export type MergeObjectPair = _ObjectPair & {
  alwaysSet?: boolean
}

export function addIssueToContext(ctx: ParseContext, issueData: EffectIssue): void {
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

export class ParseStatus {
  value: 'aborted' | 'dirty' | 'valid' = 'valid'
  dirty() {
    if (this.value === 'valid') this.value = 'dirty'
  }
  abort() {
    if (this.value !== 'aborted') this.value = 'aborted'
  }

  static mergeArray(status: ParseStatus, results: SyncParseReturnType[]): SyncParseReturnType {
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
    pairs: { key: ParseReturnType; value: ParseReturnType }[]
  ): Promise<SyncParseReturnType> {
    const syncPairs: _ObjectPair[] = []
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

export const isAborted = (x: ParseReturnType): x is InvalidParseReturnType =>
  (x as SyncParseReturnType).status === 'aborted'
export const isDirty = <T>(x: ParseReturnType<T>): x is ValidParseReturnType<T> | DirtyParseReturnType<T> =>
  (x as SyncParseReturnType).status === 'dirty'
export const isValid = <T>(x: ParseReturnType<T>): x is ValidParseReturnType<T> =>
  (x as SyncParseReturnType).status === 'valid'
export const isAsync = <T>(x: ParseReturnType<T>): x is AsyncParseReturnType<T> =>
  typeof Promise !== 'undefined' && x instanceof Promise

export const getParsedType = (data: unknown): ZodParsedType => {
  switch (typeof data) {
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
      if (typeof Promise !== 'undefined' && data instanceof Promise) {
        return 'promise'
      }
      if (
        // for fake promises
        (data as Promise<unknown>).then &&
        typeof (data as Promise<unknown>).then === 'function' &&
        (data as Promise<unknown>).catch &&
        typeof (data as Promise<unknown>).catch === 'function'
      ) {
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
  _path: _ParsePath
  _key: string | number | (string | number)[]
  _cachedPath: _ParsePath = []
  constructor(parent: ParseContext, value: any, path: _ParsePath, key: string | number | (string | number)[]) {
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
