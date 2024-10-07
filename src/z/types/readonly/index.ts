import {
  processCreateParams,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  isValid,
  ParseInput,
  ParseReturnType,
} from '../index'

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

export interface ZodReadonlyDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  innerType: T
  typeName: ZodFirstPartyTypeKind.ZodReadonly
}

export class ZodReadonly<T extends ZodTypeAny = ZodTypeAny> extends ZodType<
  MakeReadonly<T['_output']>,
  ZodReadonlyDef<T>,
  MakeReadonly<T['_input']>
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodReadonly({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const result = this._def.innerType._parse(input)
    if (isValid(result)) {
      result.value = Object.freeze(result.value)
    }
    return result
  }

  static create = <T extends ZodTypeAny>(type: T, params?: RawCreateParams): ZodReadonly<T> => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params),
    }) as any
  }

  unwrap() {
    return this._def.innerType
  }
}
