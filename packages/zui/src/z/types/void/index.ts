import type { IZodVoid, ZodVoidDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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
      return { status: 'aborted' }
    }
    return { status: 'valid', value: input.data }
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodVoidImpl
  }
}
