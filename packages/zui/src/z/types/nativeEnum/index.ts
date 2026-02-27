import { isEqual } from 'lodash-es'
import type { EnumLike, IZodNativeEnum, ZodNativeEnumDef } from '../../typings'
import * as utils from '../../utils'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../basetype'

export class ZodNativeEnumImpl<T extends EnumLike = EnumLike>
  extends ZodBaseTypeImpl<T[keyof T], ZodNativeEnumDef<T>>
  implements IZodNativeEnum<T>
{
  _parse(input: ParseInput): ParseReturnType<T[keyof T]> {
    const nativeEnumValues = this._getValidEnumValues(this._def.values)

    const ctx = this._getOrReturnCtx(input)
    if (ctx.parsedType !== 'string' && ctx.parsedType !== 'number') {
      const expectedValues = Object.values(nativeEnumValues)
      addIssueToContext(ctx, {
        expected: utils.others.joinValues(expectedValues) as 'string',
        received: ctx.parsedType,
        code: 'invalid_type',
      })
      return INVALID
    }

    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues: any[] = Object.values(nativeEnumValues)

      addIssueToContext(ctx, {
        received: ctx.data,
        code: 'invalid_enum_value',
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data)
  }

  get enum() {
    return this._def.values
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodNativeEnumImpl)) return false
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
