import type { IZodReadonly, IZodBaseType, MakeReadonly, ZodReadonlyDef } from '../../typings'
import { ZodBaseTypeImpl, isValid, ParseInput, ParseReturnType } from '../basetype'

export class ZodReadonlyImpl<T extends IZodBaseType = IZodBaseType>
  extends ZodBaseTypeImpl<MakeReadonly<T['_output']>, ZodReadonlyDef<T>, MakeReadonly<T['_input']>>
  implements IZodReadonly<T>
{
  dereference(defs: Record<string, IZodBaseType>): ZodBaseTypeImpl {
    return new ZodReadonlyImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): IZodReadonly<T> {
    return new ZodReadonlyImpl({
      ...this._def,
      innerType: this._def.innerType.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const result = ZodBaseTypeImpl.fromInterface(this._def.innerType)._parse(input)
    if (isValid(result)) {
      result.value = Object.freeze(result.value)
    }
    return result
  }

  unwrap() {
    return this._def.innerType
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodReadonlyImpl)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): IZodReadonly<IZodBaseType> {
    return new ZodReadonlyImpl({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
