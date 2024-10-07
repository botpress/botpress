import { unique } from '../../utils'
import {
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  ZodError,
  ZodIssue,
  ZodIssueCode,
  processCreateParams,
  addIssueToContext,
  DIRTY,
  INVALID,
  ParseContext,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../index'

type DefaultZodUnionOptions = Readonly<[ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]>
export type ZodUnionOptions = Readonly<[ZodTypeAny, ...ZodTypeAny[]]>
export interface ZodUnionDef<T extends ZodUnionOptions = DefaultZodUnionOptions> extends ZodTypeDef {
  options: T
  typeName: ZodFirstPartyTypeKind.ZodUnion
}

export class ZodUnion<T extends ZodUnionOptions = DefaultZodUnionOptions> extends ZodType<
  T[number]['_output'],
  ZodUnionDef<T>,
  T[number]['_input']
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    const options = this._def.options.map((option) => option.dereference(defs)) as [
      ZodTypeAny,
      ZodTypeAny,
      ...ZodTypeAny[],
    ]
    return new ZodUnion({
      ...this._def,
      options,
    })
  }

  getReferences(): string[] {
    return unique(
      this._def.options.reduce<string[]>((acc, option) => {
        return [...acc, ...option.getReferences()]
      }, []),
    )
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    const options = this._def.options

    function handleResults(results: { ctx: ParseContext; result: SyncParseReturnType<any> }[]) {
      // return first issue-free validation if it exists
      for (const result of results) {
        if (result.result.status === 'valid') {
          return result.result
        }
      }

      for (const result of results) {
        if (result.result.status === 'dirty') {
          // add issues from dirty option
          ctx.common.issues.push(...result.ctx.common.issues)
          return result.result
        }
      }

      // return invalid
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues))

      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors,
      })
      return INVALID
    }

    if (ctx.common.async) {
      return Promise.all(
        options.map(async (option) => {
          const childCtx: ParseContext = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: [],
            },
            parent: null,
          }
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx,
            }),
            ctx: childCtx,
          }
        }),
      ).then(handleResults)
    } else {
      let dirty: undefined | { result: DIRTY<any>; ctx: ParseContext } = undefined
      const issues: ZodIssue[][] = []
      for (const option of options) {
        const childCtx: ParseContext = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: [],
          },
          parent: null,
        }
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx,
        })

        if (result.status === 'valid') {
          return result
        } else if (result.status === 'dirty' && !dirty) {
          dirty = { result, ctx: childCtx }
        }

        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues)
        }
      }

      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues)
        return dirty.result
      }

      const unionErrors = issues.map((issues) => new ZodError(issues))
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors,
      })

      return INVALID
    }
  }

  get options() {
    return this._def.options
  }

  static create = <T extends Readonly<[ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]>>(
    types: T,
    params?: RawCreateParams,
  ): ZodUnion<T> => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params),
    })
  }
}
