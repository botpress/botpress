import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'
import type { IZodVoid, ZodVoidDef } from '../../typings'

export class ZodVoidImpl extends ZodBaseTypeImpl<void, ZodVoidDef> implements IZodVoid {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== 'undefined') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'void',
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodVoidImpl
  }
}
