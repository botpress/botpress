import * as utils from '../../utils'
import { ZodAny } from '../any'
import { ZodArray } from '../array'
import {
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  ParseInputLazyPath,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
} from '../basetype'

// TODO(circle): these may potentially cause circular dependencies errors
import { ZodEnum } from '../enum'
import { ZodNever } from '../never'
import { ZodNullable } from '../nullable'
import { ZodOptional } from '../optional'
import { ZodTuple, type ZodTupleItems } from '../tuple'

export type ZodRawShape = { [k: string]: ZodType }

export type UnknownKeysParam = 'passthrough' | 'strict' | 'strip' | ZodType

export type ZodObjectDef<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = {
  typeName: 'ZodObject'
  shape: () => T
  unknownKeys: UnknownKeys
} & ZodTypeDef

type _ObjectOutputType<
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = _UnknownKeysOutputType<UnknownKeys> &
  utils.types.Flatten<utils.types.AddQuestionMarks<_BaseObjectOutputType<Shape>>>

type _BaseObjectOutputType<Shape extends ZodRawShape> = {
  [k in keyof Shape]: Shape[k]['_output']
}

type _ObjectInputType<
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = utils.types.Flatten<_BaseObjectInputType<Shape>> & _UnknownKeysInputType<UnknownKeys>

type _BaseObjectInputType<Shape extends ZodRawShape> = utils.types.AddQuestionMarks<{
  [k in keyof Shape]: Shape[k]['_input']
}>

type _UnknownKeysInputType<T extends UnknownKeysParam> = T extends ZodType
  ? { [k: string]: T['_input'] | unknown } // extra properties cannot contradict the main properties
  : T extends 'passthrough'
    ? { [k: string]: unknown }
    : {}

type _UnknownKeysOutputType<T extends UnknownKeysParam> = T extends ZodType
  ? { [k: string]: T['_output'] | unknown } // extra properties cannot contradict the main properties
  : T extends 'passthrough'
    ? { [k: string]: unknown }
    : {}

type _AdditionalProperties<T extends UnknownKeysParam> = T extends ZodType
  ? T
  : T extends 'passthrough'
    ? ZodAny
    : T extends 'strict'
      ? ZodNever
      : undefined

type _Deoptional<T extends ZodType> =
  T extends ZodOptional<infer U> ? _Deoptional<U> : T extends ZodNullable<infer U> ? ZodNullable<_Deoptional<U>> : T

/**
 * @deprecated use ZodObject instead
 */
export type SomeZodObject = ZodObject<ZodRawShape, UnknownKeysParam>

/**
 * @deprecated use ZodObject instead
 */
export type AnyZodObject = ZodObject<any, any>

type _KeyOfObject<T extends ZodRawShape> = utils.types.Cast<utils.types.UnionToTuple<keyof T>, [string, ...string[]]>

type _DeepPartial<T extends ZodType> = T extends ZodObject
  ? ZodObject<{ [k in keyof T['shape']]: ZodOptional<_DeepPartial<T['shape'][k]>> }, T['_def']['unknownKeys']>
  : T extends ZodArray<infer Type, infer Card>
    ? ZodArray<_DeepPartial<Type>, Card>
    : T extends ZodOptional<infer Type>
      ? ZodOptional<_DeepPartial<Type>>
      : T extends ZodNullable<infer Type>
        ? ZodNullable<_DeepPartial<Type>>
        : T extends ZodTuple<infer Items>
          ? {
              [k in keyof Items]: Items[k] extends ZodType ? _DeepPartial<Items[k]> : never
            } extends infer PI
            ? PI extends ZodTupleItems
              ? ZodTuple<PI>
              : never
            : never
          : T

export class ZodObject<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
  Output = _ObjectOutputType<T, UnknownKeys>,
  Input = _ObjectInputType<T, UnknownKeys>,
> extends ZodType<Output, ZodObjectDef<T, UnknownKeys>, Input> {
  private _cached: { shape: T; keys: string[] } | null = null

  _getCached(): { shape: T; keys: string[] } {
    if (this._cached !== null) return this._cached
    const shape = this._def.shape()
    const keys = Object.keys(shape)
    return (this._cached = { shape, keys })
  }

  dereference(defs: Record<string, ZodType>): ZodType {
    const currentShape = this._def.shape()
    const shape: Record<string, ZodType> = {}
    for (const key in currentShape) {
      shape[key] = currentShape[key]!.dereference(defs)
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape,
    })
  }

  getReferences(): string[] {
    const shape = this._def.shape()
    const refs: string[] = []
    for (const key in shape) {
      refs.push(...shape[key]!.getReferences())
    }
    return utils.fn.unique(refs)
  }

  clone(): ZodObject<T, UnknownKeys, Output, Input> {
    const newShape: Record<string, ZodType> = {}
    const currentShape = this._def.shape()
    for (const [key, value] of Object.entries(currentShape)) {
      newShape[key] = value.clone()
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape,
    }) as ZodObject<T, UnknownKeys, Output, Input>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== 'object') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'object',
        received: ctx.parsedType,
      })
      return INVALID
    }

    const { status, ctx } = this._processInputParams(input)

    const { shape, keys: shapeKeys } = this._getCached()
    const extraKeys: string[] = []

    if (this._def.unknownKeys !== 'strip') {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key)
        }
      }
    }

    const pairs: {
      key: ParseReturnType<any>
      value: ParseReturnType<any>
      alwaysSet?: boolean
    }[] = []
    for (const key of shapeKeys) {
      const keyValidator = shape[key]!
      const value = ctx.data[key]
      pairs.push({
        key: { status: 'valid', value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data,
      })
    }

    const unknownKeys = this._def.unknownKeys
    if (unknownKeys === 'passthrough') {
      for (const key of extraKeys) {
        pairs.push({
          key: { status: 'valid', value: key },
          value: { status: 'valid', value: ctx.data[key] },
        })
      }
    } else if (unknownKeys === 'strict') {
      if (extraKeys.length > 0) {
        addIssueToContext(ctx, {
          code: 'unrecognized_keys',
          keys: extraKeys,
        })
        status.dirty()
      }
    } else if (unknownKeys === 'strip') {
    } else {
      // run catchall validation
      for (const key of extraKeys) {
        const value = ctx.data[key]
        pairs.push({
          key: { status: 'valid', value: key },
          value: unknownKeys._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data,
        })
      }
    }

    if (ctx.common.async) {
      return Promise.resolve()
        .then(async () => {
          const syncPairs: any[] = []
          for (const pair of pairs) {
            const key = await pair.key
            syncPairs.push({
              key,
              value: await pair.value,
              alwaysSet: pair.alwaysSet,
            })
          }
          return syncPairs
        })
        .then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs)
        })
    } else {
      return ParseStatus.mergeObjectSync(status, pairs as any)
    }
  }

  get shape() {
    return this._def.shape()
  }

  strict(message?: utils.errors.ErrMessage): ZodObject<T, 'strict'> {
    utils.errors.errToObj
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strict',
      ...(message !== undefined
        ? {
            errorMap: (issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError
              if (issue.code === 'unrecognized_keys') {
                return {
                  message: utils.errors.errToObj(message).message ?? defaultError,
                }
              }
              return {
                message: defaultError,
              }
            },
          }
        : {}),
    })
  }

  strip(): ZodObject<T, 'strip'> {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strip',
    })
  }

  passthrough(): ZodObject<T, 'passthrough'> {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'passthrough',
    })
  }

  /**
   * @returns The ZodType that is used to validate additional properties or undefined if extra keys are stripped.
   */
  additionalProperties(): _AdditionalProperties<UnknownKeys> {
    if (this._def.unknownKeys instanceof ZodType) {
      return this._def.unknownKeys as _AdditionalProperties<UnknownKeys>
    }
    if (this._def.unknownKeys === 'passthrough') {
      return ZodAny.create() as _AdditionalProperties<UnknownKeys>
    }
    if (this._def.unknownKeys === 'strict') {
      return ZodNever.create() as _AdditionalProperties<UnknownKeys>
    }
    return undefined as _AdditionalProperties<UnknownKeys>
  }

  /**
   * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
   * If you want to pass through unknown properties, use `.passthrough()` instead.
   */
  nonstrict = this.passthrough

  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     })
  //   };
  extend<Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ): ZodObject<utils.types.ExtendShape<T, Augmentation>, UnknownKeys> {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation,
      }),
    })
  }
  // extend<
  //   Augmentation extends ZodRawShape,
  //   NewOutput extends util.flatten<{
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   }>,
  //   NewInput extends util.flatten<{
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }>
  // >(
  //   augmentation: Augmentation
  // ): ZodObject<
  //   extendShape<T, Augmentation>,
  //   UnknownKeys,
  //   Catchall,
  //   NewOutput,
  //   NewInput
  // > {
  //   return new ZodObject({
  //     ...this._def,
  //     shape: () => ({
  //       ...this._def.shape(),
  //       ...augmentation,
  //     }),
  //   })
  // }
  /**
   * @deprecated Use `.extend` instead
   *  */
  augment = this.extend

  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge<Incoming extends AnyZodObject, Augmentation extends Incoming['shape']>(
    merging: Incoming
  ): ZodObject<utils.types.ExtendShape<T, Augmentation>, Incoming['_def']['unknownKeys']> {
    const merged: any = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape(),
      }),
      typeName: 'ZodObject',
    })
    return merged
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       utils.types.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: 'ZodObject',
  //   });
  //   return merged;
  // }
  setKey<Key extends string, Schema extends ZodType>(
    key: Key,
    schema: Schema
  ): ZodObject<
    T & {
      [k in Key]: Schema
    },
    UnknownKeys
  > {
    return this.augment({ [key]: schema }) as ZodObject<
      T & {
        [k in Key]: Schema
      },
      UnknownKeys
    >
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = utils.types.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       utils.types.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: 'ZodObject',
  //   });
  //   return merged;
  // }
  catchall<Index extends ZodType>(index: Index): ZodObject<T, Index> {
    return new ZodObject({
      ...this._def,
      unknownKeys: index,
    })
  }

  pick<
    Mask extends {
      [k in keyof T]?: true
    },
  >(mask: Mask): ZodObject<Pick<T, Extract<keyof T, keyof Mask>>, UnknownKeys> {
    const shape: any = {}

    Object.keys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key]
      }
    })

    return new ZodObject({
      ...this._def,
      shape: () => shape,
    })
  }

  omit<
    Mask extends {
      [k in keyof T]?: true
    },
  >(mask: Mask): ZodObject<Omit<T, keyof Mask>, UnknownKeys> {
    const shape: any = {}

    Object.keys(this.shape).forEach((key) => {
      if (!mask[key]) {
        shape[key] = this.shape[key]
      }
    })

    return new ZodObject({
      ...this._def,
      shape: () => shape,
    })
  }

  /**
   * @deprecated
   */
  deepPartial(): _DeepPartial<this> {
    return this._deepPartialify(this)
  }

  partial(): ZodObject<
    {
      [k in keyof T]: ZodOptional<T[k]>
    },
    UnknownKeys
  >
  partial<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): ZodObject<
    utils.types.NoNever<{
      [k in keyof T]: k extends keyof Mask ? ZodOptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  partial(mask?: any) {
    const newShape: Record<string, ZodType | undefined> = {}

    Object.keys(this.shape).forEach((key) => {
      const fieldSchema = this.shape[key]

      if (mask && !mask[key]) {
        newShape[key] = fieldSchema
      } else {
        newShape[key] = fieldSchema?.optional()
      }
    })

    return new ZodObject({
      ...this._def,
      shape: () => newShape as ZodRawShape,
    })
  }

  required(): ZodObject<
    {
      [k in keyof T]: _Deoptional<T[k]>
    },
    UnknownKeys
  >
  required<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): ZodObject<
    utils.types.NoNever<{
      [k in keyof T]: k extends keyof Mask ? _Deoptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  required(mask?: any) {
    const newShape: any = {}

    Object.keys(this.shape).forEach((key) => {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key]
      } else {
        const fieldSchema = this.shape[key]
        let newField = fieldSchema

        while (newField instanceof ZodOptional) {
          newField = (newField as ZodOptional<any>)._def.innerType
        }

        newShape[key] = newField
      }
    })

    return new ZodObject({
      ...this._def,
      shape: () => newShape,
    })
  }

  keyof(): ZodEnum<_KeyOfObject<T>> {
    return ZodEnum.create(Object.keys(this.shape) as [string, ...string[]]) as any
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodObject)) return false
    if (!this._unknownKeysEqual(schema)) return false

    const thisShape = this._def.shape()
    const thatShape = schema._def.shape()

    type Property = [string, ZodType]
    const compare = (a: Property, b: Property) => a[0] === b[0] && a[1].isEqual(b[1])
    const thisProps = new utils.ds.CustomSet<Property>(Object.entries(thisShape), { compare })
    const thatProps = new utils.ds.CustomSet<Property>(Object.entries(thatShape), { compare })

    return thisProps.isEqual(thatProps)
  }

  private _unknownKeysEqual(that: ZodObject): boolean {
    const thisAdditionalProperties = this.additionalProperties()
    const thatAdditionalProperties = that.additionalProperties()
    if (thisAdditionalProperties === undefined || thatAdditionalProperties === undefined) {
      return thisAdditionalProperties === thatAdditionalProperties
    }
    return thisAdditionalProperties.isEqual(thatAdditionalProperties)
  }

  static create = <T extends ZodRawShape>(shape: T, params?: RawCreateParams): ZodObject<T, 'strip'> => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: 'strip',
      typeName: 'ZodObject',
      ...processCreateParams(params),
    })
  }

  static strictCreate = <T extends ZodRawShape>(shape: T, params?: RawCreateParams): ZodObject<T, 'strict'> => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: 'strict',
      typeName: 'ZodObject',
      ...processCreateParams(params),
    })
  }

  static lazycreate = <T extends ZodRawShape>(shape: () => T, params?: RawCreateParams): ZodObject<T, 'strip'> => {
    return new ZodObject({
      shape,
      unknownKeys: 'strip',
      typeName: 'ZodObject',
      ...processCreateParams(params),
    })
  }

  private _deepPartialify(schema: ZodType): any {
    if (schema instanceof ZodObject) {
      const newShape: any = {}

      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key]
        newShape[key] = ZodOptional.create(this._deepPartialify(fieldSchema))
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape,
      })
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: this._deepPartialify(schema.element),
      })
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(this._deepPartialify(schema.unwrap()))
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(this._deepPartialify(schema.unwrap()))
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item: any) => this._deepPartialify(item)))
    } else {
      return schema
    }
  }
}
