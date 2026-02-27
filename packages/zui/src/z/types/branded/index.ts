import type { IZodBranded, IZodBaseType, ZodBrandedDef, BRAND } from '../../typings'
import { ZodBaseTypeImpl, ParseInput, ParseReturnType } from '../basetype'

type Key = string | number | symbol

export class ZodBrandedImpl<T extends IZodBaseType = IZodBaseType, B extends Key = Key>
  extends ZodBaseTypeImpl<T['_output'] & BRAND<B>, ZodBrandedDef<T>, T['_input']>
  implements IZodBranded<T, B>
{
  dereference(defs: Record<string, IZodBaseType>): IZodBaseType {
    return new ZodBrandedImpl({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
  }

  clone(): IZodBranded<T, B> {
    return new ZodBrandedImpl({
      ...this._def,
      type: this._def.type.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<any> {
    const { ctx } = this._processInputParams(input)
    const data = ctx.data
    return ZodBaseTypeImpl.fromInterface(this._def.type)._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }

  unwrap() {
    return this._def.type
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodBrandedImpl)) return false
    return this._def.type.isEqual(schema._def.type)
  }

  naked(): IZodBaseType {
    return this._def.type.naked()
  }

  mandatory(): IZodBranded<IZodBaseType, B> {
    return new ZodBrandedImpl({
      ...this._def,
      type: this._def.type.mandatory(),
    })
  }
}
