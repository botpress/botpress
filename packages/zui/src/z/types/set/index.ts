import type { IZodSet, IZodType, ZodSetDef } from '../../typings'
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

export class ZodSetImpl<Value extends IZodType = IZodType>
  extends ZodBaseTypeImpl<Set<Value['_output']>, ZodSetDef<Value>, Set<Value['_input']>>
  implements IZodSet<Value>
{
  dereference(defs: Record<string, IZodType>): IZodType {
    return new ZodSetImpl({
      ...this._def,
      valueType: this._def.valueType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.valueType.getReferences()
  }

  clone(): IZodSet<Value> {
    return new ZodSetImpl({
      ...this._def,
      valueType: this._def.valueType.clone() as Value,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== 'set') {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'set',
        received: ctx.parsedType,
      })
      return INVALID
    }

    const def = this._def

    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: 'too_small',
          minimum: def.minSize.value,
          type: 'set',
          inclusive: true,
          exact: false,
          message: def.minSize.message,
        })
        status.dirty()
      }
    }

    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: 'too_big',
          maximum: def.maxSize.value,
          type: 'set',
          inclusive: true,
          exact: false,
          message: def.maxSize.message,
        })
        status.dirty()
      }
    }

    const valueType = this._def.valueType

    function finalizeSet(elements: SyncParseReturnType<any>[]) {
      const parsedSet = new Set()
      for (const element of elements) {
        if (element.status === 'aborted') return INVALID
        if (element.status === 'dirty') status.dirty()
        parsedSet.add(element.value)
      }
      return { status: status.value, value: parsedSet }
    }

    const elements = [...(ctx.data as Set<unknown>).values()].map((item, i) =>
      ZodBaseTypeImpl.fromInterface(valueType)._parse(new ParseInputLazyPath(ctx, item, ctx.path, i))
    )

    if (ctx.common.async) {
      return Promise.all(elements).then((elements) => finalizeSet(elements))
    } else {
      return finalizeSet(elements as SyncParseReturnType<any>[])
    }
  }

  min(minSize: number, message?: utils.errors.ErrMessage): this {
    return new ZodSetImpl({
      ...this._def,
      minSize: { value: minSize, message: utils.errors.toString(message) },
    }) as this
  }

  max(maxSize: number, message?: utils.errors.ErrMessage): this {
    return new ZodSetImpl({
      ...this._def,
      maxSize: { value: maxSize, message: utils.errors.toString(message) },
    }) as this
  }

  size(size: number, message?: utils.errors.ErrMessage): this {
    return this.min(size, message).max(size, message) as this
  }

  nonempty(message?: utils.errors.ErrMessage): IZodSet<Value> {
    return this.min(1, message) as this
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodSetImpl)) return false

    const thisMin = this._def.minSize?.value
    const thatMin = schema._def.minSize?.value
    if (thisMin !== thatMin) return false // min message is not important for equality

    const thisMax = this._def.maxSize?.value
    const thatMax = schema._def.maxSize?.value
    if (thisMax !== thatMax) return false // max message is not important for equality

    return this._def.valueType.isEqual(schema._def.valueType)
  }
}
