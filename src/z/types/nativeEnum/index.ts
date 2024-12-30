import { isEqual } from 'lodash-es'

import {
  ZodIssueCode,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  util,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export interface ZodNativeEnumDef<T extends EnumLike = EnumLike> extends ZodTypeDef {
  values: T
  typeName: ZodFirstPartyTypeKind.ZodNativeEnum
}

export type EnumLike = { [k: string]: string | number; [nu: number]: string }

export class ZodNativeEnum<T extends EnumLike = EnumLike> extends ZodType<T[keyof T], ZodNativeEnumDef<T>> {
  _parse(input: ParseInput): ParseReturnType<T[keyof T]> {
    const nativeEnumValues = util.getValidEnumValues(this._def.values)

    const ctx = this._getOrReturnCtx(input)
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues)
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues) as 'string',
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      })
      return INVALID
    }

    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues = util.objectValues(nativeEnumValues)

      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data as any)
  }

  get enum() {
    return this._def.values
  }

  static create = <T extends EnumLike>(values: T, params?: RawCreateParams): ZodNativeEnum<T> => {
    return new ZodNativeEnum({
      values: values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodNativeEnum)) return false
    return isEqual(this._def.values, schema._def.values)
  }
}
