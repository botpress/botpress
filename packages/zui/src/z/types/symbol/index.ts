import type { IZodSymbol, ZodSymbolDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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
      return { status: 'aborted' }
    }

    return { status: 'valid', value: input.data }
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodSymbolImpl
  }
}
