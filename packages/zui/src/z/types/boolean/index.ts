import type { IZodBoolean, ZodBooleanDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'

export class ZodBooleanImpl extends ZodBaseTypeImpl<boolean, ZodBooleanDef> implements IZodBoolean {
  _parse(input: ParseInput): ParseReturnType<boolean> {
    if (this._def.coerce) {
      input.data = Boolean(input.data)
    }
    const parsedType = this._getType(input)

    if (parsedType !== 'boolean') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'boolean',
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodBooleanImpl)) return false
    return this._def.coerce === schema._def.coerce
  }
}
