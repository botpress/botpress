import type { IZodLazy, IZodType, ZodLazyDef, input, output } from '../../typings'
import { ZodBaseTypeImpl, ParseInput, ParseReturnType } from '../basetype'

export class ZodLazyImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<output<T>, ZodLazyDef<T>, input<T>>
  implements IZodLazy<T>
{
  get schema(): T {
    return this._def.getter()
  }

  dereference(defs: Record<string, IZodType>): IZodType {
    return new ZodLazyImpl({
      ...this._def,
      getter: () => this._def.getter().dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.getter().getReferences()
  }

  clone(): IZodLazy<T> {
    return new ZodLazyImpl({
      ...this._def,
      getter: () => this._def.getter().clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    const lazySchema = this._def.getter()
    return ZodBaseTypeImpl.fromInterface(lazySchema)._parse({ data: ctx.data, path: ctx.path, parent: ctx })
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodLazyImpl)) return false
    return this._def.getter().isEqual(schema._def.getter())
  }

  naked() {
    return this._def.getter().naked()
  }

  mandatory(): IZodLazy<IZodType> {
    return new ZodLazyImpl({
      ...this._def,
      getter: () => this._def.getter().mandatory(),
    })
  }
}
