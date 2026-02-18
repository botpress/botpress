import { isEqual } from 'lodash-es'
import { ZodIssueCode } from '../../error'
import * as utils from '../../utils'
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

export type ZodNativeEnumDef<T extends EnumLike = EnumLike> = {
  values: T
  typeName: 'ZodNativeEnum'
} & ZodTypeDef

export type EnumLike = { [k: string]: string | number; [nu: number]: string }

export class ZodNativeEnum<T extends EnumLike = EnumLike> extends ZodType<T[keyof T], ZodNativeEnumDef<T>> {
  _parse(input: ParseInput): ParseReturnType<T[keyof T]> {
    const nativeEnumValues = this._getValidEnumValues(this._def.values)

    const ctx = this._getOrReturnCtx(input)
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = Object.values(nativeEnumValues)
      addIssueToContext(ctx, {
        expected: utils.others.joinValues(expectedValues) as 'string',
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      })
      return INVALID
    }

    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues: any[] = Object.values(nativeEnumValues)

      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data)
  }

  get enum() {
    return this._def.values
  }

  static create = <T extends EnumLike>(values: T, params?: RawCreateParams): ZodNativeEnum<T> => {
    return new ZodNativeEnum({
      values,
      typeName: 'ZodNativeEnum',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodNativeEnum)) return false
    return isEqual(this._def.values, schema._def.values)
  }

  private _getValidEnumValues = (obj: EnumLike) => {
    const validKeys = Object.keys(obj).filter((k: any) => typeof obj[obj[k]!] !== 'number')
    const filtered: EnumLike = {}
    for (const k of validKeys) {
      filtered[k] = obj[k]!
    }
    return Object.values(filtered)
  }
}
