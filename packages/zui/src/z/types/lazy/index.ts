import type { IZodLazy, IZodType, ZodLazyDef, input, output, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl } from '../basetype'

export class ZodLazyImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<output<T>, ZodLazyDef<T>, input<T>>
  implements IZodLazy<T>
{
  // keyed by ZodLazyDef.uid, not object identity — see ZodLazyDef.uid
  private static readonly _expandingReferences = new Set<symbol>()

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
    const uid = this._def.uid
    if (ZodLazyImpl._expandingReferences.has(uid)) {
      // cycle: anything reachable past this point was already collected by the enclosing call
      return []
    }
    ZodLazyImpl._expandingReferences.add(uid)
    try {
      return this._def.getter().getReferences()
    } finally {
      ZodLazyImpl._expandingReferences.delete(uid)
    }
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
