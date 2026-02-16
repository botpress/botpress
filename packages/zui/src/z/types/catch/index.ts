import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { ZodError } from '../error'
import { processCreateParams, util } from '../utils'
import { isAsync, ParseContext, ParseInput, ParseReturnType } from '../utils/parseUtil'

export type CatchFn<Y> = (ctx: { error: ZodError; input: unknown }) => Y
export type ZodCatchDef<T extends ZodType = ZodType> = {
  innerType: T
  catchValue: CatchFn<T['_output']>
  typeName: 'ZodCatch'
} & ZodTypeDef

export class ZodCatch<T extends ZodType = ZodType> extends ZodType<
  T['_output'],
  ZodCatchDef<T>,
  unknown // any input will pass validation // T["_input"]
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)

    // newCtx is used to not collect issues from inner types in ctx
    const newCtx: ParseContext = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: [],
      },
    }

    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx,
      },
    })

    if (isAsync(result)) {
      return result.then((result) => {
        return {
          status: 'valid',
          value:
            result.status === 'valid'
              ? result.value
              : this._def.catchValue({
                  get error() {
                    return new ZodError(newCtx.common.issues)
                  },
                  input: newCtx.data,
                }),
        }
      })
    } else {
      return {
        status: 'valid',
        value:
          result.status === 'valid'
            ? result.value
            : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues)
                },
                input: newCtx.data,
              }),
      }
    }
  }

  removeCatch() {
    return this._def.innerType
  }

  static create = <T extends ZodType>(
    type: T,
    params: RawCreateParams & {
      catch: T['_output'] | CatchFn<T['_output']>
    }
  ): ZodCatch<T> => {
    return new ZodCatch({
      innerType: type,
      typeName: 'ZodCatch',
      catchValue: typeof params.catch === 'function' ? params.catch : () => params.catch,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodCatch)) return false
    return (
      this._def.innerType.isEqual(schema._def.innerType) &&
      util.compareFunctions(this._def.catchValue, schema._def.catchValue)
    )
  }

  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodCatch({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): ZodCatch<T> {
    return new ZodCatch({
      ...this._def,
      innerType: this._def.innerType.clone(),
    }) as ZodCatch<T>
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): ZodCatch<ZodType> {
    return new ZodCatch({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
