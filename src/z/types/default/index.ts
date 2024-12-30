import { isEqual } from 'lodash-es'

import {
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  util,
  ZodParsedType,
  ParseInput,
  ParseReturnType,
} from '../index'

export interface ZodDefaultDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  innerType: T
  defaultValue: () => util.noUndefined<T['_input']>
  typeName: ZodFirstPartyTypeKind.ZodDefault
}

export class ZodDefault<T extends ZodTypeAny = ZodTypeAny> extends ZodType<
  util.noUndefined<T['_output']>,
  ZodDefaultDef<T>,
  T['_input'] | undefined
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    let data = ctx.data
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue()
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }

  removeDefault() {
    return this._def.innerType
  }

  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodDefault({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  static create = <T extends ZodTypeAny>(
    type: T,
    value: T['_input'] | (() => util.noUndefined<T['_input']>),
    params?: RawCreateParams,
  ): ZodDefault<T> => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof value === 'function' ? value : () => value as any,
      ...processCreateParams(params),
    }) as any
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodDefault)) return false
    return (
      this._def.innerType.isEqual(schema._def.innerType) &&
      isEqual(this._def.defaultValue(), schema._def.defaultValue())
    )
  }
}
