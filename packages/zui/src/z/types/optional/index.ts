import type { IZodOptional, IZodType, ZodOptionalDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl } from '../basetype'

export class ZodOptionalImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<T['_output'] | undefined, ZodOptionalDef<T>, T['_input'] | undefined>
  implements IZodOptional<T>
{
  protected _dereferenceSelf(defs: Record<string, IZodType>, memo: WeakMap<IZodType, IZodType>): IZodType {
    return new ZodOptionalImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs, memo),
    })
  }

  _getReferences(visiting: Set<symbol>): string[] {
    return this._def.innerType._getReferences(visiting)
  }

  protected _cloneSelf(memo: WeakMap<IZodType, IZodType>): IZodOptional<T> {
    return new ZodOptionalImpl({
      ...this._def,
      innerType: this._def.innerType.clone(memo) as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === 'undefined') {
      return { status: 'valid', value: undefined }
    }
    return this._def.innerType._parse(input)
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
