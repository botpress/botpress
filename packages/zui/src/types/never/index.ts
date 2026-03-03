import type { IZodNever, ZodNeverDef } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../basetype'

export type { ZodNeverDef }

export class ZodNeverImpl extends ZodBaseTypeImpl<never, ZodNeverDef> implements IZodNever {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: 'invalid_type',
      expected: 'never',
      received: ctx.parsedType,
    })
    return INVALID
  }
  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodNeverImpl
  }
}
