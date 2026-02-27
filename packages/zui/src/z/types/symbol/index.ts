import type { IZodSymbol, ZodSymbolDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'

export class ZodSymbolImpl extends ZodBaseTypeImpl<symbol, ZodSymbolDef> implements IZodSymbol {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== 'symbol') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'symbol',
        received: ctx.parsedType,
      })
      return INVALID
    }

    return OK(input.data)
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodSymbolImpl
  }
}
