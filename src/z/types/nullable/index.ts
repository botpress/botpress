import {
  OK,
  ParseInput,
  ParseReturnType,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
} from '../index'

export interface ZodNullableDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  innerType: T
  typeName: ZodFirstPartyTypeKind.ZodNullable
}

export type ZodNullableType<T extends ZodTypeAny> = ZodNullable<T>

export class ZodNullable<T extends ZodTypeAny = ZodTypeAny> extends ZodType<
  T['_output'] | null,
  ZodNullableDef<T>,
  T['_input'] | null
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodNullable({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === ZodParsedType.null) {
      return OK(null)
    }
    return this._def.innerType._parse(input)
  }

  unwrap() {
    return this._def.innerType
  }

  static create = <T extends ZodTypeAny>(type: T, params?: RawCreateParams): ZodNullable<T> => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodNullable)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }
}
