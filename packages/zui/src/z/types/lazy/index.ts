import type { IZodLazy, IZodType, ZodLazyDef, input, output, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl } from '../basetype'

export class ZodLazyImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<output<T>, ZodLazyDef<T>, input<T>>
  implements IZodLazy<T>
{
  // uids (ZodLazyDef.uid) currently being expanded by getReferences(), shared across all
  // ZodLazyImpl instances. Keyed by uid rather than by `this` because .title()/.describe()
  // clone schemas (cascading into any nested ZodLazy), so the same logical lazy node can show
  // up as a different object on each occurrence; uid survives .clone()/.dereference()/.mandatory()
  // since those only override `getter`.
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
