import { ZodBaseTypeImpl, addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../basetype'
import type { IZodNaN, ZodNaNDef } from '../../typings'

export class ZodNaNImpl extends ZodBaseTypeImpl<number, ZodNaNDef> implements IZodNaN {
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

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodNaNImpl
  }
}
