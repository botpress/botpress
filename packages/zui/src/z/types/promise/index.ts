import type { IZodPromise, IZodType, ZodPromiseDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'
export type { ZodPromiseDef }

export class ZodPromiseImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<Promise<T['_output']>, ZodPromiseDef<T>, Promise<T['_input']>>
  implements IZodPromise<T>
{
  unwrap() {
    return this._def.type
  }

  dereference(defs: Record<string, IZodType>): IZodType {
    return new ZodPromiseImpl({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
  }

  clone(): IZodPromise<T> {
    return new ZodPromiseImpl({
      ...this._def,
      type: this._def.type.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    if (ctx.parsedType !== 'promise' && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'promise',
        received: ctx.parsedType,
      })
      return INVALID
    }

    const promisified = ctx.parsedType === 'promise' ? ctx.data : Promise.resolve(ctx.data)

    return OK(
      promisified.then((data: any) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap,
        })
      })
    )
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodPromiseImpl)) return false
    return this._def.type.isEqual(schema._def.type)
  }

  naked() {
    return this._def.type.naked()
  }
}
