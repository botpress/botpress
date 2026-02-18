import { isEqual } from 'lodash-es'
import { ZodIssueCode } from '../../error'
import * as utils from '../../utils'
import {
  ParseInputLazyPath,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  ParseStatus,
} from '../index'

export type ZodArrayDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodArray'
  exactLength: { value: number; message?: string } | null
  minLength: { value: number; message?: string } | null
  maxLength: { value: number; message?: string } | null
} & ZodTypeDef

export type ArrayCardinality = 'many' | 'atleastone'
export type arrayOutputType<
  T extends ZodType,
  Cardinality extends ArrayCardinality = 'many',
> = Cardinality extends 'atleastone' ? [T['_output'], ...T['_output'][]] : T['_output'][]

export class ZodArray<T extends ZodType = ZodType, Cardinality extends ArrayCardinality = 'many'> extends ZodType<
  arrayOutputType<T, Cardinality>,
  ZodArrayDef<T>,
  Cardinality extends 'atleastone' ? [T['_input'], ...T['_input'][]] : T['_input'][]
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodArray({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
  }

  clone(): ZodArray<T, Cardinality> {
    return new ZodArray({
      ...this._def,
      type: this._def.type.clone(),
    }) as ZodArray<T, Cardinality>
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodArray)) {
      return false
    }
    return (
      // message is not considered for equality
      isEqual(this._def.exactLength?.value, schema._def.exactLength?.value) &&
      isEqual(this._def.maxLength?.value, schema._def.maxLength?.value) &&
      isEqual(this._def.minLength?.value, schema._def.minLength?.value) &&
      this._def.type.isEqual(schema._def.type)
    )
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx, status } = this._processInputParams(input)

    const def = this._def

    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType,
      })
      return INVALID
    }

    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value
      const tooSmall = ctx.data.length < def.exactLength.value
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: (tooSmall ? def.exactLength.value : undefined) as number,
          maximum: (tooBig ? def.exactLength.value : undefined) as number,
          type: 'array',
          inclusive: true,
          exact: true,
          message: def.exactLength.message,
        })
        status.dirty()
      }
    }

    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: 'array',
          inclusive: true,
          exact: false,
          message: def.minLength.message,
        })
        status.dirty()
      }
    }

    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: 'array',
          inclusive: true,
          exact: false,
          message: def.maxLength.message,
        })
        status.dirty()
      }
    }

    if (ctx.common.async) {
      return Promise.all(
        [...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i))
        })
      ).then((result) => {
        return ParseStatus.mergeArray(status, result)
      })
    }

    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i))
    })

    return ParseStatus.mergeArray(status, result)
  }

  get element() {
    return this._def.type
  }

  min(minLength: number, message?: utils.errors.ErrMessage): this {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: utils.errors.toString(message) },
    }) as this
  }

  max(maxLength: number, message?: utils.errors.ErrMessage): this {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: utils.errors.toString(message) },
    }) as this
  }

  length(len: number, message?: utils.errors.ErrMessage): this {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: utils.errors.toString(message) },
    }) as this
  }

  nonempty(message?: utils.errors.ErrMessage): ZodArray<T, 'atleastone'> {
    return this.min(1, message) as ZodArray<T, 'atleastone'>
  }

  static create = <T extends ZodType>(schema: T, params?: RawCreateParams): ZodArray<T> => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: 'ZodArray',
      ...processCreateParams(params),
    })
  }
}

export type ZodNonEmptyArray<T extends ZodType> = ZodArray<T, 'atleastone'>
