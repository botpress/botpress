import { isEqual } from 'lodash-es'
import * as utils from '../../utils'

import {
  //
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ParseInput,
  ParseReturnType,
} from '../basetype'

export type ZodDefaultDef<T extends ZodType = ZodType> = {
  innerType: T
  defaultValue: () => utils.types.NoUndefined<T['_input']>
  typeName: 'ZodDefault'
} & ZodTypeDef

export class ZodDefault<T extends ZodType = ZodType> extends ZodType<
  utils.types.NoUndefined<T['_output']>,
  ZodDefaultDef<T>,
  T['_input'] | undefined
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    let data = ctx.data
    if (ctx.parsedType === 'undefined') {
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

  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodDefault({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): ZodDefault<T> {
    return new ZodDefault({
      ...this._def,
      innerType: this._def.innerType.clone(),
    }) as ZodDefault<T>
  }

  static create = <T extends ZodType>(
    type: T,
    value: T['_input'] | (() => utils.types.NoUndefined<T['_input']>),
    params?: RawCreateParams
  ): ZodDefault<T> => {
    return new ZodDefault({
      innerType: type,
      typeName: 'ZodDefault',
      defaultValue: typeof value === 'function' ? value : () => value,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodDefault)) return false
    return (
      this._def.innerType.isEqual(schema._def.innerType) &&
      isEqual(this._def.defaultValue(), schema._def.defaultValue())
    )
  }

  unwrap() {
    return this._def.innerType
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): ZodDefault<ZodType> {
    return new ZodDefault({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
