import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { ZodIssueCode } from '../error'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export type ZodPromiseDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodPromise'
} & ZodTypeDef

export class ZodPromise<T extends ZodType = ZodType> extends ZodType<
  Promise<T['_output']>,
  ZodPromiseDef<T>,
  Promise<T['_input']>
> {
  unwrap() {
    return this._def.type
  }

  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodPromise({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
  }

  clone(): ZodPromise<T> {
    return new ZodPromise({
      ...this._def,
      type: this._def.type.clone(),
    }) as ZodPromise<T>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType,
      })
      return INVALID
    }

    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data)

    return OK(
      promisified.then((data: any) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap,
        })
      })
    )
  }

  static create = <T extends ZodType>(schema: T, params?: RawCreateParams): ZodPromise<T> => {
    return new ZodPromise({
      type: schema,
      typeName: 'ZodPromise',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodPromise)) return false
    return this._def.type.isEqual(schema._def.type)
  }

  naked() {
    return this._def.type.naked()
  }
}
