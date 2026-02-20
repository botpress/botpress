import * as utils from '../../utils'
import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../basetype'

export type EnumValues = [string, ...string[]]

export type EnumValuesMap<T extends EnumValues> = {
  [k in T[number]]: k
}

export type ZodEnumDef<T extends EnumValues = EnumValues> = {
  values: T
  typeName: 'ZodEnum'
} & ZodTypeDef

type _FilterEnum<Values, ToExclude> = Values extends []
  ? []
  : Values extends [infer Head, ...infer Rest]
    ? Head extends ToExclude
      ? _FilterEnum<Rest, ToExclude>
      : [Head, ..._FilterEnum<Rest, ToExclude>]
    : never

type _NeverCast<A, T> = A extends T ? A : never

export class ZodEnum<T extends [string, ...string[]] = [string, ...string[]]> extends ZodType<
  T[number],
  ZodEnumDef<T>
> {
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

  get options() {
    return this._def.values
  }

  get enum(): EnumValuesMap<T> {
    const enumValues: any = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }

  get Values(): EnumValuesMap<T> {
    const enumValues: any = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }

  get Enum(): EnumValuesMap<T> {
    const enumValues: any = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }

  extract<ToExtract extends readonly [T[number], ...T[number][]]>(
    values: ToExtract,
    newDef: RawCreateParams = this._def
  ): ZodEnum<utils.types.Writeable<ToExtract>> {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef,
    })
  }

  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef: RawCreateParams = this._def
  ): ZodEnum<_NeverCast<utils.types.Writeable<_FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>> {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)) as _FilterEnum<T, ToExclude[number]>, {
      ...this._def,
      ...newDef,
    }) as ZodEnum<_NeverCast<utils.types.Writeable<_FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
  }

  static create<U extends string, T extends Readonly<[U, ...U[]]>>(
    values: T,
    params?: RawCreateParams
  ): ZodEnum<utils.types.Writeable<T>>
  static create<U extends string, T extends [U, ...U[]]>(values: T, params?: RawCreateParams): ZodEnum<T>
  static create(values: [string, ...string[]], params?: RawCreateParams) {
    return new ZodEnum({
      values,
      typeName: 'ZodEnum',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodEnum)) return false
    const thisValues = new utils.ds.CustomSet<string>(this._def.values)
    const thatValues = new utils.ds.CustomSet<string>(schema._def.values)
    return thisValues.isEqual(thatValues)
  }
}
