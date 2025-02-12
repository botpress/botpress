import {
  ZodIssueCode,
  ParseInputLazyPath,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  errorUtil,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../index'

export interface ZodSetDef<Value extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  valueType: Value
  typeName: ZodFirstPartyTypeKind.ZodSet
  minSize: { value: number; message?: string } | null
  maxSize: { value: number; message?: string } | null
}

export class ZodSet<Value extends ZodTypeAny = ZodTypeAny> extends ZodType<
  Set<Value['_output']>,
  ZodSetDef<Value>,
  Set<Value['_input']>
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodSet({
      ...this._def,
      valueType: this._def.valueType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.valueType.getReferences()
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType,
      })
      return INVALID
    }

    const def = this._def

    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
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
          code: ZodIssueCode.too_big,
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
      valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)),
    )

    if (ctx.common.async) {
      return Promise.all(elements).then((elements) => finalizeSet(elements))
    } else {
      return finalizeSet(elements as SyncParseReturnType[])
    }
  }

  min(minSize: number, message?: errorUtil.ErrMessage): this {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) },
    }) as this
  }

  max(maxSize: number, message?: errorUtil.ErrMessage): this {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) },
    }) as this
  }

  size(size: number, message?: errorUtil.ErrMessage): this {
    return this.min(size, message).max(size, message) as this
  }

  nonempty(message?: errorUtil.ErrMessage): ZodSet<Value> {
    return this.min(1, message) as this
  }

  static create = <Value extends ZodTypeAny = ZodTypeAny>(
    valueType: Value,
    params?: RawCreateParams,
  ): ZodSet<Value> => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodSet)) return false

    const thisMin = this._def.minSize?.value
    const thatMin = schema._def.minSize?.value
    if (thisMin !== thatMin) return false // min message is not important for equality

    const thisMax = this._def.maxSize?.value
    const thatMax = schema._def.maxSize?.value
    if (thisMax !== thatMax) return false // max message is not important for equality

    return this._def.valueType.isEqual(schema._def.valueType)
  }
}
