import type {
  IZodReadonly,
  IZodType,
  MakeReadonly,
  ZodReadonlyDef,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../../typings'
import { isAsync, ZodBaseTypeImpl } from '../basetype'

export class ZodReadonlyImpl<T extends IZodType = IZodType>
  extends ZodBaseTypeImpl<MakeReadonly<T['_output']>, ZodReadonlyDef<T>, MakeReadonly<T['_input']>>
  implements IZodReadonly<T>
{
  dereference(defs: Record<string, IZodType>): ZodBaseTypeImpl {
    return new ZodReadonlyImpl({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): IZodReadonly<T> {
    return new ZodReadonlyImpl({
      ...this._def,
      innerType: this._def.innerType.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const result = this._def.innerType._parse(input)
    if (isAsync(result)) {
      return result.then(this._freeze)
    }
    return this._freeze(result)
  }

  private _freeze = (result: SyncParseReturnType<T['_output']>): SyncParseReturnType<this['_output']> => {
    if (result.status !== 'valid') {
      return result
    }
    return { ...result, value: Object.freeze(result.value) }
  }

  unwrap() {
    return this._def.innerType
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodReadonlyImpl)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): IZodReadonly<IZodType> {
    return new ZodReadonlyImpl({
      ...this._def,
      innerType: this._def.innerType.mandatory(),
    })
  }
}
