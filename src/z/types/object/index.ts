import { unique } from '../../utils'
import {
  ZodArray,
  ZodEnum,
  ZodNullable,
  ZodOptional,
  ZodTuple,
  addIssueToContext,
  INVALID,
  objectUtil,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  util,
  ZodIssueCode,
  ZodParsedType,
  ParseInputLazyPath,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodRawShape,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  enumUtil,
  errorUtil,
  partialUtil,
  createZodEnum,
  ZodUnknown,
  ZodNever,
} from '../index'
import { CustomSet } from '../utils/custom-set'

export type UnknownKeysParam = 'passthrough' | 'strict' | 'strip' | ZodTypeAny

export interface ZodObjectDef<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodObject
  shape: () => T
  unknownKeys: UnknownKeys
}

export type mergeTypes<A, B> = {
  [k in keyof A | keyof B]: k extends keyof B ? B[k] : k extends keyof A ? A[k] : never
}

export type objectOutputType<
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = objectUtil.flatten<objectUtil.addQuestionMarks<baseObjectOutputType<Shape>>> & UnknownKeysOutputType<UnknownKeys>

export type baseObjectOutputType<Shape extends ZodRawShape> = {
  [k in keyof Shape]: Shape[k]['_output']
}

export type objectInputType<
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = objectUtil.flatten<baseObjectInputType<Shape>> & UnknownKeysInputType<UnknownKeys>
export type baseObjectInputType<Shape extends ZodRawShape> = objectUtil.addQuestionMarks<{
  [k in keyof Shape]: Shape[k]['_input']
}>

export type UnknownKeysInputType<T extends UnknownKeysParam> = T extends ZodTypeAny
  ? { [k: string]: T['_input'] }
  : T extends 'passthrough'
    ? { [k: string]: unknown }
    : {}

export type UnknownKeysOutputType<T extends UnknownKeysParam> = T extends ZodTypeAny
  ? { [k: string]: T['_output'] }
  : T extends 'passthrough'
    ? { [k: string]: unknown }
    : {}

export type deoptional<T extends ZodTypeAny> =
  T extends ZodOptional<infer U> ? deoptional<U> : T extends ZodNullable<infer U> ? ZodNullable<deoptional<U>> : T

export type SomeZodObject = ZodObject<ZodRawShape, UnknownKeysParam>

export type noUnrecognized<Obj extends object, Shape extends object> = {
  [k in keyof Obj]: k extends keyof Shape ? Obj[k] : never
}
function deepPartialify(schema: ZodTypeAny): any {
  if (schema instanceof ZodObject) {
    const newShape: any = {}

    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key]
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema))
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape,
    })
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element),
    })
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()))
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()))
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item: any) => deepPartialify(item)))
  } else {
    return schema
  }
}

export class ZodObject<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
  Output = objectOutputType<T, UnknownKeys>,
  Input = objectInputType<T, UnknownKeys>,
> extends ZodType<Output, ZodObjectDef<T, UnknownKeys>, Input> {
  private _cached: { shape: T; keys: string[] } | null = null

  _getCached(): { shape: T; keys: string[] } {
    if (this._cached !== null) return this._cached
    const shape = this._def.shape()
    const keys = util.objectKeys(shape)
    return (this._cached = { shape, keys })
  }

  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    const currentShape = this._def.shape()
    const shape: Record<string, ZodTypeAny> = {}
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
    return unique(refs)
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.object) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
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
          code: ZodIssueCode.unrecognized_keys,
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
            new ParseInputLazyPath(ctx, value, ctx.path, key), //, ctx.child(key), value, getParsedType(value)
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

  strict(message?: errorUtil.ErrMessage): ZodObject<T, 'strict'> {
    errorUtil.errToObj
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strict',
      ...(message !== undefined
        ? {
            errorMap: (issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError
              if (issue.code === 'unrecognized_keys')
                return {
                  message: errorUtil.errToObj(message).message ?? defaultError,
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
    augmentation: Augmentation,
  ): ZodObject<objectUtil.extendShape<T, Augmentation>, UnknownKeys> {
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
    merging: Incoming,
  ): ZodObject<objectUtil.extendShape<T, Augmentation>, Incoming['_def']['unknownKeys']> {
    const merged: any = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape(),
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject,
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
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   });
  //   return merged;
  // }
  setKey<Key extends string, Schema extends ZodTypeAny>(
    key: Key,
    schema: Schema,
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
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   });
  //   return merged;
  // }
  catchall<Index extends ZodTypeAny>(index: Index): ZodObject<T, Index> {
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

    util.objectKeys(mask).forEach((key) => {
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

    util.objectKeys(this.shape).forEach((key) => {
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
  deepPartial(): partialUtil.DeepPartial<this> {
    return deepPartialify(this)
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
    mask: Mask,
  ): ZodObject<
    objectUtil.noNever<{
      [k in keyof T]: k extends keyof Mask ? ZodOptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  partial(mask?: any) {
    const newShape: Record<string, ZodTypeAny | undefined> = {}

    util.objectKeys(this.shape).forEach((key) => {
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
      [k in keyof T]: deoptional<T[k]>
    },
    UnknownKeys
  >
  required<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask,
  ): ZodObject<
    objectUtil.noNever<{
      [k in keyof T]: k extends keyof Mask ? deoptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  required(mask?: any) {
    const newShape: any = {}

    util.objectKeys(this.shape).forEach((key) => {
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

  keyof(): ZodEnum<enumUtil.UnionToTupleString<keyof T>> {
    return createZodEnum(util.objectKeys(this.shape) as [string, ...string[]]) as any
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodObject)) return false
    if (!this._unknownKeysEqual(schema._def.unknownKeys)) return false

    const thisShape = this._def.shape()
    const thatShape = schema._def.shape()

    type Property = [string, ZodTypeAny]
    const compare = (a: Property, b: Property) => a[0] === b[0] && a[1].isEqual(b[1])
    const thisProps = new CustomSet<Property>(Object.entries(thisShape), { compare })
    const thatProps = new CustomSet<Property>(Object.entries(thatShape), { compare })

    return thisProps.isEqual(thatProps)
  }

  private _unknownKeysEqual(that: UnknownKeysParam): boolean {
    if (this._def.unknownKeys instanceof ZodType && that instanceof ZodType) {
      return this._def.unknownKeys.isEqual(that)
    }
    return this._def.unknownKeys === that
  }

  static create = <T extends ZodRawShape>(shape: T, params?: RawCreateParams): ZodObject<T, 'strip'> => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: 'strip',
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params),
    })
  }

  static strictCreate = <T extends ZodRawShape>(shape: T, params?: RawCreateParams): ZodObject<T, 'strict'> => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: 'strict',
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params),
    })
  }

  static lazycreate = <T extends ZodRawShape>(shape: () => T, params?: RawCreateParams): ZodObject<T, 'strip'> => {
    return new ZodObject({
      shape,
      unknownKeys: 'strip',
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params),
    })
  }
}

export type AnyZodObject = ZodObject<any, any>
