import type { IZodRecord, IZodString, IZodBaseType, KeySchema, RecordType, ZodRecordDef } from '../../typings'
import * as utils from '../../utils'
import {
  ParseInputLazyPath,
  ZodBaseTypeImpl,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  type MergeObjectPair,
} from '../basetype'

export class ZodRecordImpl<Key extends KeySchema = IZodString, Value extends IZodBaseType = IZodBaseType>
  extends ZodBaseTypeImpl<
    RecordType<Key['_output'], Value['_output']>,
    ZodRecordDef<Key, Value>,
    RecordType<Key['_input'], Value['_input']>
  >
  implements IZodRecord<Key, Value>
{
  get keySchema() {
    return this._def.keyType
  }
  get valueSchema() {
    return this._def.valueType
  }

  dereference(defs: Record<string, IZodBaseType>): IZodBaseType {
    const keyType = this._def.keyType.dereference(defs)
    const valueType = this._def.valueType.dereference(defs)
    return new ZodRecordImpl({
      ...this._def,
      keyType,
      valueType,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([...this._def.keyType.getReferences(), ...this._def.valueType.getReferences()])
  }

  clone(): IZodRecord<Key, Value> {
    return new ZodRecordImpl({
      ...this._def,
      keyType: this._def.keyType.clone() as Key,
      valueType: this._def.valueType.clone() as Value,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== 'object') {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'object',
        received: ctx.parsedType,
      })
      return INVALID
    }

    const pairs: {
      key: ParseReturnType<any>
      value: ParseReturnType<any>
    }[] = []

    const keyType = this._def.keyType
    const valueType = this._def.valueType

    for (const key in ctx.data) {
      pairs.push({
        key: ZodBaseTypeImpl.fromInterface(keyType)._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: ZodBaseTypeImpl.fromInterface(valueType)._parse(
          new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)
        ),
      })
    }

    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs)
    } else {
      return ParseStatus.mergeObjectSync(status, pairs as MergeObjectPair[])
    }
  }

  get element() {
    return this._def.valueType
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodRecordImpl)) return false
    if (!this._def.keyType.isEqual(schema._def.keyType)) return false
    if (!this._def.valueType.isEqual(schema._def.valueType)) return false
    return true
  }
}
