import type { IZodNullable, IZodBaseType, ZodNullableDef } from '../../typings'
import { OK, ParseInput, ParseReturnType, ZodBaseTypeImpl } from '../basetype'

export class ZodNullableImpl<T extends IZodBaseType = IZodBaseType>
  extends ZodBaseTypeImpl<T['_output'] | null, ZodNullableDef<T>, T['_input'] | null>
  implements IZodNullable<T>
{
  dereference(defs: Record<string, IZodBaseType>): ZodBaseTypeImpl {
    return new ZodNullableImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): IZodNullable<T> {
    return new ZodNullableImpl({
      ...this._def,
      innerType: this._def.innerType.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === 'null') {
      return OK(null)
    }
    return ZodBaseTypeImpl.fromInterface(this._def.innerType)._parse(input)
  }

  unwrap() {
    return this._def.innerType
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodNullableImpl)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): IZodNullable<IZodBaseType> {
    return new ZodNullableImpl({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
