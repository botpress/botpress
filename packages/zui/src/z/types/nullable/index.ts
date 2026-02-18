import {
  //
  OK,
  ParseInput,
  ParseReturnType,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
} from '../basetype'

export type ZodNullableDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodNullable'
} & ZodTypeDef

export type ZodNullableType<T extends ZodType> = ZodNullable<T>

export class ZodNullable<T extends ZodType = ZodType> extends ZodType<
  T['_output'] | null,
  ZodNullableDef<T>,
  T['_input'] | null
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodNullable({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): ZodNullable<T> {
    return new ZodNullable({
      ...this._def,
      innerType: this._def.innerType.clone(),
    }) as ZodNullable<T>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === 'null') {
      return OK(null)
    }
    return this._def.innerType._parse(input)
  }

  unwrap() {
    return this._def.innerType
  }

  static create = <T extends ZodType>(type: T, params?: RawCreateParams): ZodNullable<T> => {
    return new ZodNullable({
      innerType: type,
      typeName: 'ZodNullable',
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

  mandatory(): ZodNullable<ZodType> {
    return new ZodNullable({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
