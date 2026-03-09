import type { IZodNaN, ZodNaNDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

export class ZodNaNImpl extends ZodBaseTypeImpl<number, ZodNaNDef> implements IZodNaN {
  _parse(input: ParseInput): ParseReturnType {
    const parsedType = this._getType(input)
    if (parsedType !== 'nan') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'nan',
        received: ctx.parsedType,
      })
      return { status: 'aborted' }
    }

    return { status: 'valid', value: input.data }
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodNaNImpl
  }
}
