import {
  processCreateParams,
  ZodParsedType,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export type ZodOptionalDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodOptional'
} & ZodTypeDef

export type ZodOptionalType<T extends ZodType> = ZodOptional<T>

export class ZodOptional<T extends ZodType = ZodType> extends ZodType<
  T['_output'] | undefined,
  ZodOptionalDef<T>,
  T['_input'] | undefined
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodOptional({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): ZodOptional<T> {
    return new ZodOptional({
      ...this._def,
      innerType: this._def.innerType.clone(),
    }) as ZodOptional<T>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined)
    }
    return this._def.innerType._parse(input)
  }

  unwrap() {
    return this._def.innerType
  }

  static create = <T extends ZodType>(type: T, params?: RawCreateParams): ZodOptional<T> => {
    return new ZodOptional({
      innerType: type,
      typeName: 'ZodOptional',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodOptional)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): ZodType {
    return this._def.innerType.mandatory()
  }
}
