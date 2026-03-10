import { isEqual } from 'lodash-es'
import type { IZodLiteral, IZodType, Primitive, ZodLiteralDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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
      return { status: 'aborted' }
    }
    return { status: 'valid', value: input.data }
  }

  get value() {
    return this._def.value
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodLiteralImpl)) return false
    return isEqual(this._def.value, schema._def.value)
  }
}
