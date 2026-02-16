import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { ZodIssueCode } from '../error'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../utils/parseUtil'

export type ZodNeverDef = {
  typeName: 'ZodNever'
} & ZodTypeDef

export class ZodNever extends ZodType<never, ZodNeverDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
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
