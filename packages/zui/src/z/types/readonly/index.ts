import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { processCreateParams } from '../utils'
import { isValid, ParseInput, ParseReturnType } from '../utils/parseUtil'

type BuiltIn =
  | (((...args: any[]) => any) | (new (...args: any[]) => any))
  | { readonly [Symbol.toStringTag]: string }
  | Date
  | Error
  | Generator
  | Promise<unknown>
  | RegExp

type MakeReadonly<T> =
  T extends Map<infer K, infer V>
    ? ReadonlyMap<K, V>
    : T extends Set<infer V>
      ? ReadonlySet<V>
      : T extends [infer Head, ...infer Tail]
        ? readonly [Head, ...Tail]
        : T extends Array<infer V>
          ? ReadonlyArray<V>
          : T extends BuiltIn
            ? T
            : Readonly<T>

export type ZodReadonlyDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodReadonly'
} & ZodTypeDef

export class ZodReadonly<T extends ZodType = ZodType> extends ZodType<
  MakeReadonly<T['_output']>,
  ZodReadonlyDef<T>,
  MakeReadonly<T['_input']>
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodReadonly({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): ZodReadonly<T> {
    return new ZodReadonly({
      ...this._def,
      innerType: this._def.innerType.clone(),
    }) as ZodReadonly<T>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const result = this._def.innerType._parse(input)
    if (isValid(result)) {
      result.value = Object.freeze(result.value)
    }
    return result
  }

  static create = <T extends ZodType>(type: T, params?: RawCreateParams): ZodReadonly<T> => {
    return new ZodReadonly({
      innerType: type,
      typeName: 'ZodReadonly',
      ...processCreateParams(params),
    })
  }

  unwrap() {
    return this._def.innerType
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodReadonly)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): ZodReadonly<ZodType> {
    return new ZodReadonly({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
