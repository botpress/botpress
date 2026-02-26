import type { IZodNull, ZodNullDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'

export class ZodNullImpl extends ZodBaseTypeImpl<null, ZodNullDef> implements IZodNull {
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
  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodNullImpl
  }
}
