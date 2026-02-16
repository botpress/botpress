import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { ZodIssueCode } from '../error'
import { ZodNever } from '../never'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export type ZodUndefinedDef = {
  typeName: 'ZodUndefined'
} & ZodTypeDef

export class ZodUndefined extends ZodType<undefined, ZodUndefinedDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
  params?: RawCreateParams

  static create = (params?: RawCreateParams): ZodUndefined => {
    return new ZodUndefined({
      typeName: 'ZodUndefined',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return schema instanceof ZodUndefined
  }

  mandatory(): ZodNever {
    return ZodNever.create({
      ...this._def,
    })
  }
}
