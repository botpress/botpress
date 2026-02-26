import { builders } from '../../internal-builders'
import type { IZodNever, IZodUndefined, ZodUndefinedDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'

export class ZodUndefinedImpl extends ZodBaseTypeImpl<undefined, ZodUndefinedDef> implements IZodUndefined {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== 'undefined') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'undefined',
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodUndefinedImpl
  }

  mandatory(): IZodNever {
    return builders.never({
      ...this._def,
    })
  }
}
