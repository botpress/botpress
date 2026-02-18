import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
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
    if (parsedType !== 'nan') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'nan',
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
