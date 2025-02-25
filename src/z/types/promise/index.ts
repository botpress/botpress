import {
  ZodIssueCode,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export interface ZodPromiseDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  type: T
  typeName: ZodFirstPartyTypeKind.ZodPromise
}

export class ZodPromise<T extends ZodTypeAny = ZodTypeAny> extends ZodType<
  Promise<T['_output']>,
  ZodPromiseDef<T>,
  Promise<T['_input']>
> {
  unwrap() {
    return this._def.type
  }

  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodPromise({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
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
      }),
    )
  }

  static create = <T extends ZodTypeAny>(schema: T, params?: RawCreateParams): ZodPromise<T> => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodTypeAny): boolean {
    if (!(schema instanceof ZodPromise)) return false
    return this._def.type.isEqual(schema._def.type)
  }

  naked() {
    return this._def.type.naked()
  }
}
