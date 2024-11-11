import isEqual from 'lodash/isEqual'
import {
  ZodIssueCode,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  Primitive,
} from '../index'

export interface ZodLiteralDef<T extends Primitive = Primitive> extends ZodTypeDef {
  value: T
  typeName: ZodFirstPartyTypeKind.ZodLiteral
}

export class ZodLiteral<T extends Primitive = Primitive> extends ZodType<T, ZodLiteralDef<T>> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value,
      })
      return INVALID
    }
    return { status: 'valid', value: input.data }
  }

  get value() {
    return this._def.value
  }

  static create = <T extends Primitive>(value: T, params?: RawCreateParams): ZodLiteral<T> => {
    return new ZodLiteral({
      value: value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodLiteral)) return false
    return isEqual(this._def.value, schema._def.value)
  }
}
