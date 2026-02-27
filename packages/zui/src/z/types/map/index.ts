import type { IZodMap, IZodBaseType, ZodMapDef } from '../../typings'
import * as utils from '../../utils'
import {
  ParseInputLazyPath,
  ZodBaseTypeImpl,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../basetype'

export class ZodMapImpl<Key extends IZodBaseType = IZodBaseType, Value extends IZodBaseType = IZodBaseType>
  extends ZodBaseTypeImpl<
    Map<Key['_output'], Value['_output']>,
    ZodMapDef<Key, Value>,
    Map<Key['_input'], Value['_input']>
  >
  implements IZodMap<Key, Value>
{
  get keySchema() {
    return this._def.keyType
  }
  get valueSchema() {
    return this._def.valueType
  }

  dereference(defs: Record<string, IZodBaseType>): ZodBaseTypeImpl {
    const keyType = this._def.keyType.dereference(defs)
    const valueType = this._def.valueType.dereference(defs)
    return new ZodMapImpl({
      ...this._def,
      keyType,
      valueType,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([...this._def.keyType.getReferences(), ...this._def.valueType.getReferences()])
  }

  clone(): IZodMap<Key, Value> {
    return new ZodMapImpl({
      ...this._def,
      keyType: this._def.keyType.clone() as Key,
      valueType: this._def.valueType.clone() as Value,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== 'map') {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'map',
        received: ctx.parsedType,
      })
      return INVALID
    }

    const keyType = this._def.keyType
    const valueType = this._def.valueType

    const pairs = [...(ctx.data as Map<unknown, unknown>).entries()].map(([key, value], index) => {
      return {
        key: ZodBaseTypeImpl.fromInterface(keyType)._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, 'key'])),
        value: ZodBaseTypeImpl.fromInterface(valueType)._parse(
          new ParseInputLazyPath(ctx, value, ctx.path, [index, 'value'])
        ),
      }
    })

    if (ctx.common.async) {
      const finalMap = new Map()
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key
          const value = await pair.value
          if (key.status === 'aborted' || value.status === 'aborted') {
            return INVALID
          }
          if (key.status === 'dirty' || value.status === 'dirty') {
            status.dirty()
          }

          finalMap.set(key.value, value.value)
        }
        return { status: status.value, value: finalMap }
      })
    } else {
      const finalMap = new Map()
      for (const pair of pairs) {
        const key = pair.key as SyncParseReturnType<any>
        const value = pair.value as SyncParseReturnType<any>
        if (key.status === 'aborted' || value.status === 'aborted') {
          return INVALID
        }
        if (key.status === 'dirty' || value.status === 'dirty') {
          status.dirty()
        }

        finalMap.set(key.value, value.value)
      }
      return { status: status.value, value: finalMap }
    }
  }
  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodMapImpl)) return false
    if (!this._def.keyType.isEqual(schema._def.keyType)) return false
    if (!this._def.valueType.isEqual(schema._def.valueType)) return false
    return true
  }
}
