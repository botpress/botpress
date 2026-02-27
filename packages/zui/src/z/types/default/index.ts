import { isEqual } from 'lodash-es'
import type { IZodBaseType, IZodDefault, ZodDefaultDef } from '../../typings'
import * as utils from '../../utils'
import { ZodBaseTypeImpl, ParseInput, ParseReturnType } from '../basetype'

export class ZodDefaultImpl<T extends IZodBaseType = IZodBaseType>
  extends ZodBaseTypeImpl<utils.types.NoUndefined<T['_output']>, ZodDefaultDef<T>, T['_input'] | undefined>
  implements IZodDefault<T>
{
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    let data = ctx.data
    if (ctx.parsedType === 'undefined') {
      data = this._def.defaultValue()
    }
    return ZodBaseTypeImpl.fromInterface(this._def.innerType)._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }

  removeDefault() {
    return this._def.innerType
  }

  dereference(defs: Record<string, IZodBaseType>): IZodBaseType {
    return new ZodDefaultImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): IZodDefault<T> {
    return new ZodDefaultImpl({
      ...this._def,
      innerType: this._def.innerType.clone() as T,
    })
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodDefaultImpl)) return false
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

  mandatory(): IZodDefault<IZodBaseType> {
    return new ZodDefaultImpl({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
