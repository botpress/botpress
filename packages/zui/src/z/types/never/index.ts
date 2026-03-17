import type { IZodNever, IZodType, ZodNeverDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

export type { ZodNeverDef }

export class ZodNeverImpl extends ZodBaseTypeImpl<never, ZodNeverDef> implements IZodNever {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: 'invalid_type',
      expected: 'never',
      received: ctx.parsedType,
    })
    return { status: 'aborted' }
  }
  isEqual(schema: IZodType): boolean {
    return schema instanceof ZodNeverImpl
  }
}
