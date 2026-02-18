import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
} from '../basetype'

export type ZodNeverDef = {
  typeName: 'ZodNever'
} & ZodTypeDef

export class ZodNever extends ZodType<never, ZodNeverDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: 'invalid_type',
      expected: 'never',
      received: ctx.parsedType,
    })
    return INVALID
  }
  static create = (params?: RawCreateParams): ZodNever => {
    return new ZodNever({
      typeName: 'ZodNever',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return schema instanceof ZodNever
  }
}
