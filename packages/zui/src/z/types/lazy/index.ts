import type { IZodLazy, IZodType, ZodLazyDef, input, output, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl } from '../basetype'

export class ZodLazyImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<output<T>, ZodLazyDef<T>, input<T>>
  implements IZodLazy<T>
{
  get schema(): T {
    return this._def.getter()
  }

  protected _dereferenceSelf(defs: Record<string, IZodType>, memo: WeakMap<IZodType, IZodType>): IZodType {
    return new ZodLazyImpl({
      ...this._def,
      getter: () => this._def.getter().dereference(defs, memo),
    })
  }

  _getReferences(visiting: Set<symbol>): string[] {
    if (visiting.has(this._def.uid)) {
      return []
    }
    visiting.add(this._def.uid)
    return this._def.getter()._getReferences(visiting)
  }

  protected _cloneSelf(memo: WeakMap<IZodType, IZodType>): IZodLazy<T> {
    // The getter is lazy, so it runs after the base registers this clone; a self-reference through it
    // resolves back to this clone. Objects and z.lazy are the only recursion anchors.
    return new ZodLazyImpl({
      ...this._def,
      getter: () => this._def.getter().clone(memo) as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    const lazySchema = this._def.getter()
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx })
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
