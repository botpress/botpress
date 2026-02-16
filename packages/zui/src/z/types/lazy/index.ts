import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ParseInput,
  ParseReturnType,
  output,
  input,
} from '../index'

export type ZodLazyDef<T extends ZodType = ZodType> = {
  getter: () => T
  typeName: 'ZodLazy'
} & ZodTypeDef

export class ZodLazy<T extends ZodType = ZodType> extends ZodType<output<T>, ZodLazyDef<T>, input<T>> {
  get schema(): T {
    return this._def.getter()
  }

  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodLazy({
      ...this._def,
      getter: () => this._def.getter().dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.getter().getReferences()
  }

  clone(): ZodLazy<T> {
    return new ZodLazy({
      ...this._def,
      getter: () => this._def.getter().clone(),
    }) as ZodLazy<T>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)
    const lazySchema = this._def.getter()
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx })
  }

  static create = <T extends ZodType>(getter: () => T, params?: RawCreateParams): ZodLazy<T> => {
    return new ZodLazy({
      getter,
      typeName: 'ZodLazy',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodLazy)) return false
    return this._def.getter().isEqual(schema._def.getter())
  }

  naked() {
    return this._def.getter().naked()
  }

  mandatory(): ZodLazy<ZodType> {
    return new ZodLazy({
      ...this._def,
      getter: () => this._def.getter().mandatory(),
    })
  }
}
