import * as utils from '../../../utils'
import { builders } from '../../internal-builders'
import type {
  FilterEnum,
  IZodEnum,
  EnumValuesMap,
  NeverCast,
  ZodEnumDef,
  EnumValues,
  ParseInput,
  ParseReturnType,
  ZodCreateParams,
} from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, OK } from '../basetype'

export class ZodEnumImpl<T extends EnumValues = EnumValues>
  extends ZodBaseTypeImpl<T[number], ZodEnumDef<T>>
  implements IZodEnum<T>
{
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    if (typeof input.data !== 'string') {
      const ctx = this._getOrReturnCtx(input)
      const expectedValues = this._def.values
      addIssueToContext(ctx, {
        expected: utils.others.joinValues(expectedValues) as 'string',
        received: ctx.parsedType,
        code: 'invalid_type',
      })
      return INVALID
    }

    if (this._def.values.indexOf(input.data) === -1) {
      const ctx = this._getOrReturnCtx(input)
      const expectedValues = this._def.values

      addIssueToContext(ctx, {
        received: ctx.data,
        code: 'invalid_enum_value',
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data)
  }

  get options(): T {
    return this._def.values
  }

  get enum(): EnumValuesMap<T> {
    const enumValues: Record<string, T[number]> = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues as EnumValuesMap<T>
  }

  get Values(): EnumValuesMap<T> {
    return this.enum
  }

  get Enum(): EnumValuesMap<T> {
    return this.enum
  }

  extract<ToExtract extends readonly [T[number], ...T[number][]]>(
    values: ToExtract,
    newDef: ZodCreateParams = this._def
  ): IZodEnum<utils.types.Writeable<ToExtract>> {
    // TODO(why): find out why the ctor is not used directly
    return builders.enum(values, {
      ...this._def,
      ...newDef,
    })
  }

  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef: ZodCreateParams = this._def
  ): IZodEnum<NeverCast<utils.types.Writeable<FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>> {
    // TODO(why): find out why the ctor is not used directly
    return builders.enum(this.options.filter((opt) => !values.includes(opt)) as FilterEnum<T, ToExclude[number]>, {
      ...this._def,
      ...newDef,
    }) as IZodEnum<NeverCast<utils.types.Writeable<FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodEnumImpl)) return false
    const thisValues = new utils.ds.CustomSet<string>(this._def.values)
    const thatValues = new utils.ds.CustomSet<string>(schema._def.values)
    return thisValues.isEqual(thatValues)
  }
}
