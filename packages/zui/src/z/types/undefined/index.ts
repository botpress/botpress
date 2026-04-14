import { builders } from '../../internal-builders'
import type { IZodNever, IZodType, IZodUndefined, ZodUndefinedDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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
      return { status: 'aborted' }
    }
    return { status: 'valid', value: input.data }
  }

  isEqual(schema: IZodType): boolean {
    return schema instanceof ZodUndefinedImpl
  }

  mandatory(): IZodNever {
    return builders.never({
      ...this._def,
    })
  }
}
