import { ZodIssueCode } from '../../error'
import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export type ZodVoidDef = {
  typeName: 'ZodVoid'
} & ZodTypeDef

export class ZodVoid extends ZodType<void, ZodVoidDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== 'undefined') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'void',
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  static create = (params?: RawCreateParams): ZodVoid => {
    return new ZodVoid({
      typeName: 'ZodVoid',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return schema instanceof ZodVoid
  }
}
