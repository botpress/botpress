import { ZodError } from '../../error'
import { builders } from '../../internal-builders'
import type {
  DefaultZodUnionOptions,
  IZodUnion,
  IZodBaseType,
  ZodUnionDef,
  ZodUnionOptions,
  ZodIssue,
  ZodType,
} from '../../typings'
import * as utils from '../../utils'
import {
  ZodBaseTypeImpl,
  addIssueToContext,
  DIRTY,
  INVALID,
  ParseContext,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../basetype'

export class ZodUnionImpl<T extends ZodUnionOptions = DefaultZodUnionOptions>
  extends ZodBaseTypeImpl<T[number]['_output'], ZodUnionDef<T>, T[number]['_input']>
  implements IZodUnion<T>
{
  dereference(defs: Record<string, IZodBaseType>): IZodBaseType {
    const options = this._def.options.map((option) => option.dereference(defs)) as [
      IZodBaseType,
      IZodBaseType,
      ...IZodBaseType[],
    ]
    return new ZodUnionImpl({
      ...this._def,
      options,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique(
      this._def.options.reduce<string[]>((acc, option) => {
        return [...acc, ...option.getReferences()]
      }, [])
    )
  }

  clone(): IZodUnion<T> {
    const options = this._def.options.map((option) => option.clone()) as utils.types.Writeable<T>
    return new ZodUnionImpl({
      ...this._def,
      options: options as T,
    })
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
        code: 'invalid_union',
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
            result: await ZodBaseTypeImpl.fromInterface(option)._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx,
            }),
            ctx: childCtx,
          }
        })
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
        const result = ZodBaseTypeImpl.fromInterface(option)._parseSync({
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
        code: 'invalid_union',
        unionErrors,
      })

      return INVALID
    }
  }

  get options() {
    return this._def.options
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodUnionImpl)) return false

    const compare = (a: IZodBaseType, b: IZodBaseType) => a.isEqual(b)
    const thisOptions = new utils.ds.CustomSet<IZodBaseType>([...this._def.options], { compare })
    const thatOptions = new utils.ds.CustomSet<IZodBaseType>([...schema._def.options], { compare })

    return thisOptions.isEqual(thatOptions)
  }

  mandatory(): IZodBaseType {
    const options = this._def.options
      .filter((o) => !((o as ZodType).typeName === 'ZodUndefined'))
      .map((option) => option.mandatory())

    const [first, second, ...others] = options
    if (!first) {
      return builders.never({
        ...this._def,
      })
    }
    if (!second) {
      return first
    }
    return new ZodUnionImpl({
      ...this._def,
      options: [first, second, ...others],
    })
  }
}
