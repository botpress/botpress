import { isEqual } from 'lodash-es'
import type { IZodLiteral, Primitive, ZodLiteralDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../basetype'

export class ZodLiteralImpl<T extends Primitive = Primitive>
  extends ZodBaseTypeImpl<T, ZodLiteralDef<T>>
  implements IZodLiteral<T>
{
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        received: ctx.data,
        code: 'invalid_literal',
        expected: this._def.value,
      })
      return INVALID
    }
    return { status: 'valid', value: input.data }
  }

  get value() {
    return this._def.value
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodLiteralImpl)) return false
    return isEqual(this._def.value, schema._def.value)
  }
}
