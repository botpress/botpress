import { ZodBaseTypeImpl, OK, ParseInput, ParseReturnType } from '../basetype'
import type { IZodOptional, IZodType, ZodOptionalDef } from '../../typings'

export class ZodOptionalImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<T['_output'] | undefined, ZodOptionalDef<T>, T['_input'] | undefined>
  implements IZodOptional<T>
{
  dereference(defs: Record<string, IZodType>): IZodType {
    return new ZodOptionalImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): IZodOptional<T> {
    return new ZodOptionalImpl({
      ...this._def,
      innerType: this._def.innerType.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === 'undefined') {
      return OK(undefined)
    }
    return ZodBaseTypeImpl.fromInterface(this._def.innerType)._parse(input)
  }

  unwrap() {
    return this._def.innerType
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodOptionalImpl)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): IZodType {
    return this._def.innerType.mandatory()
  }
}
