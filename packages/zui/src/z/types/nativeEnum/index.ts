import { isEqual } from 'lodash-es'
import * as utils from '../../../utils'
import type { EnumLike, IZodNativeEnum, ZodNativeEnumDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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
      return { status: 'aborted' }
    }

    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues: (string | number)[] = Object.values(nativeEnumValues)

      addIssueToContext(ctx, {
        received: ctx.data,
        code: 'invalid_enum_value',
        options: expectedValues,
      })
      return { status: 'aborted' }
    }
    return { status: 'valid', value: input.data }
  }

  get enum() {
    return this._def.values
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodNativeEnumImpl)) return false
    return isEqual(this._def.values, schema._def.values)
  }

  private _getValidEnumValues = (obj: EnumLike) => {
    const validKeys = Object.keys(obj).filter((k) => typeof obj[obj[k]!] !== 'number')
    const filtered: EnumLike = {}
    for (const k of validKeys) {
      filtered[k] = obj[k]!
    }
    return Object.values(filtered)
  }
}
