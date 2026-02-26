import { ZodError } from '../../error'
import type { IZodCatch, IZodType, ZodCatchDef } from '../../typings'
import * as utils from '../../utils'
import { ZodBaseTypeImpl, isAsync, ParseContext, ParseInput, ParseReturnType } from '../basetype'

export class ZodCatchImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<
    T['_output'],
    ZodCatchDef<T>,
    unknown // any input will pass validation // T["_input"]
  >
  implements IZodCatch<T>
{
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

    const result = ZodBaseTypeImpl.fromInterface(this._def.innerType)._parse({
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

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodCatchImpl)) return false
    return (
      this._def.innerType.isEqual(schema._def.innerType) &&
      utils.others.compareFunctions(this._def.catchValue, schema._def.catchValue)
    )
  }

  dereference(defs: Record<string, IZodType>): IZodType {
    return new ZodCatchImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): IZodCatch<T> {
    return new ZodCatchImpl({
      ...this._def,
      innerType: this._def.innerType.clone() as T,
    })
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): IZodCatch<IZodType> {
    return new ZodCatchImpl({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    }) as IZodCatch<IZodType>
  }
}
