import {
  ZodIssueCode,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
} from '../index'

export type ZodNaNDef = {
  typeName: 'ZodNaN'
} & ZodTypeDef

export class ZodNaN extends ZodType<number, ZodNaNDef> {
  _parse(input: ParseInput): ParseReturnType<any> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType,
      })
      return INVALID
    }

    return { status: 'valid', value: input.data }
  }

  static create = (params?: RawCreateParams): ZodNaN => {
    return new ZodNaN({
      typeName: 'ZodNaN',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return schema instanceof ZodNaN
  }
}
