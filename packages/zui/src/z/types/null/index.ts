import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../basetype'

export type ZodNullDef = {
  typeName: 'ZodNull'
} & ZodTypeDef

export class ZodNull extends ZodType<null, ZodNullDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== 'null') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'null',
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
