import { isEqual } from 'lodash-es'
import { ZodIssueCode } from '../../error'
import * as utils from '../../utils'
import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
} from '../index'

export type ZodLiteralDef<T extends utils.types.Primitive = utils.types.Primitive> = {
  value: T
  typeName: 'ZodLiteral'
} & ZodTypeDef

export class ZodLiteral<T extends utils.types.Primitive = utils.types.Primitive> extends ZodType<T, ZodLiteralDef<T>> {
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

  static create = <T extends utils.types.Primitive>(value: T, params?: RawCreateParams): ZodLiteral<T> => {
    return new ZodLiteral({
      value,
      typeName: 'ZodLiteral',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodLiteral)) return false
    return isEqual(this._def.value, schema._def.value)
  }
}
