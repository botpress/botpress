import {
  ZodIssueCode,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export type ZodNullDef = {
  typeName: 'ZodNull'
} & ZodTypeDef

export class ZodNull extends ZodType<null, ZodNullDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
  static create = (params?: RawCreateParams): ZodNull => {
    return new ZodNull({
      typeName: 'ZodNull',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return schema instanceof ZodNull
  }
}
