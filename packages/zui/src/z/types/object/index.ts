import * as utils from '../../../utils'
import { is } from '../../guards'
import { builders } from '../../internal-builders'
import type {
  IZodObject,
  IZodType,
  ZodObjectDef,
  UnknownKeysParam,
  ZodRawShape,
  ObjectOutputType,
  ObjectInputType,
  AdditionalProperties,
  Deoptional,
  KeyOfObject,
  IZodOptional,
  IZodEnum,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../../typings'
import {
  addIssueToContext,
  ParseStatus,
  ParseInputLazyPath,
  ZodBaseTypeImpl,
  assertShapeValueIsSchema,
  type MergeObjectPair,
} from '../basetype'

export class ZodObjectImpl<T extends ZodRawShape = ZodRawShape, UnknownKeys extends UnknownKeysParam = UnknownKeysParam>
  extends ZodBaseTypeImpl<
    ObjectOutputType<T, UnknownKeys>,
    ZodObjectDef<T, UnknownKeys>,
    ObjectInputType<T, UnknownKeys>
  >
  implements IZodObject<T, UnknownKeys>
{
  /** Safe cast: ZodObject structurally satisfies IZodObject but TS can't prove it due to recursive type depth */

  private _cached: { shape: T; keys: string[] } | null = null
  // In-progress isEqual comparisons, keyed on clone-stable _def.uid pairs (source uid -> set of other uids).
  private static _comparing = new Map<symbol, Set<symbol>>()

  _getCached(): { shape: T; keys: string[] } {
    if (this._cached !== null) return this._cached
    const shape = this._def.shape()
    const keys = Object.keys(shape)
    // Materialization-time guard for getter-valued keys: the construction-time guard in builders MUST
    // skip getters (they stay lazy for recursion), so a getter returning a non-schema can only be caught
    // once the shape is read. Every consumer path funnels through here — parse (below) and `get shape()`
    // (used by the transforms, incl. toJSONSchema on `bp deploy`) — and the result is cached, so this runs
    // once per schema. The check is shallow (each value must be a schema instance), so recursion is unaffected.
    for (const key of keys) {
      assertShapeValueIsSchema(key, shape[key])
    }
    return (this._cached = { shape, keys })
  }

  protected _dereferenceSelf(defs: Record<string, IZodType>, memo: WeakMap<IZodType, IZodType>): IZodType {
    return new ZodObjectImpl({
      ...this._def,
      shape: () => {
        const currentShape = this._def.shape()
        const shape: Record<string, IZodType> = {}
        for (const key in currentShape) {
          shape[key] = currentShape[key]!.dereference(defs, memo)
        }
        return shape
      },
    })
  }

  _getReferences(visiting: Set<symbol>): string[] {
    // Key on the clone-stable _def.uid (not instance identity): traversing a cloned recursive schema mints
    // fresh clones, but they all carry the source's uid, so mutual/self cycles terminate. See ZodObjectDef.uid.
    if (visiting.has(this._def.uid)) return []
    visiting.add(this._def.uid)
    const shape = this._def.shape()
    const refs: string[] = []
    for (const key in shape) {
      refs.push(...shape[key]!._getReferences(visiting))
    }
    return utils.fn.unique(refs)
  }

  // ZodObject keeps an explicit `clone` (rather than the base's `_cloneSelf` template the other types use):
  // omitting the concrete `IZodObject<T, UnknownKeys>` return here lets declaration-emit fully resolve
  // ZodObjectImpl's assignability to IZodObject<T, 'strict'> in strict()/strictObject(), which surfaces a
  // latent additionalProperties() variance error (TS2322). The explicit return defers that check. The memo
  // logic mirrors the base: register both source and clone, before the lazy shape thunk runs, so a
  // getter-recursive schema clones into a cycle instead of an infinite tree.
  clone(memo: WeakMap<IZodType, IZodType> = new WeakMap()): IZodObject<T, UnknownKeys> {
    const hit = memo.get(this)
    if (hit) return hit as IZodObject<T, UnknownKeys>
    const cloned: IZodObject<T, UnknownKeys> = new ZodObjectImpl<T, UnknownKeys>({
      ...this._def,
      shape: () => {
        const currentShape = this._def.shape()
        const newShape: Record<string, IZodType> = {}
        for (const [key, value] of Object.entries(currentShape)) {
          newShape[key] = value.clone(memo)
        }
        return newShape as T
      },
    })
    memo.set(this, cloned)
    memo.set(cloned, cloned)
    return cloned
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
      return { status: 'aborted' }
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
      key: ParseReturnType
      value: ParseReturnType
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
          const syncPairs: {
            key: SyncParseReturnType
            value: SyncParseReturnType
            alwaysSet?: boolean
          }[] = []
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
      return ParseStatus.mergeObjectSync(status, pairs as MergeObjectPair[])
    }
  }

  get shape() {
    // Route through _getCached so the materialization-time getter guard also fires on shape reads from
    // the transforms (e.g. toJSONSchema during `bp deploy`), not only on .parse().
    return this._getCached().shape
  }

  strict(message?: utils.errors.ErrMessage): IZodObject<T, 'strict'> {
    utils.errors.errToObj
    return new ZodObjectImpl({
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

  strip(): IZodObject<T, 'strip'> {
    return new ZodObjectImpl({
      ...this._def,
      unknownKeys: 'strip',
    })
  }

  passthrough(): IZodObject<T, 'passthrough'> {
    return new ZodObjectImpl({
      ...this._def,
      unknownKeys: 'passthrough',
    })
  }

  /**
   * @returns The IZodType that is used to validate additional properties or undefined if extra keys are stripped.
   */
  additionalProperties(): AdditionalProperties<UnknownKeys> {
    if (typeof this._def.unknownKeys === 'object') {
      return this._def.unknownKeys as AdditionalProperties<UnknownKeys>
    }
    if (this._def.unknownKeys === 'passthrough') {
      return builders.any() as AdditionalProperties<UnknownKeys>
    }
    if (this._def.unknownKeys === 'strict') {
      return builders.never() as AdditionalProperties<UnknownKeys>
    }
    return undefined as AdditionalProperties<UnknownKeys>
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
  //   ): IZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return (new ZodObjectImpl({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }))
  //   };
  extend<Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ): IZodObject<utils.types.ExtendShape<T, Augmentation>, UnknownKeys> {
    return new ZodObjectImpl({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation,
      }),
      uid: Symbol('ZodObject'),
    }) as unknown as IZodObject<utils.types.ExtendShape<T, Augmentation>, UnknownKeys>
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
  // ): IZodObject<
  //   extendShape<T, Augmentation>,
  //   UnknownKeys,
  //   Catchall,
  //   NewOutput,
  //   NewInput
  // > {
  //   return (new ZodObjectImpl({
  //     ...this._def,
  //     shape: () => ({
  //       ...this._def.shape(),
  //       ...augmentation,
  //     }),
  //   }))
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
  merge<Incoming extends IZodObject<any>, Augmentation extends Incoming['shape']>(
    merging: Incoming
  ): IZodObject<utils.types.ExtendShape<T, Augmentation>, Incoming['_def']['unknownKeys']> {
    const merged = new ZodObjectImpl({
      unknownKeys: merging._def.unknownKeys as Incoming['_def']['unknownKeys'],
      shape: () =>
        ({
          ...this._def.shape(),
          ...merging._def.shape(),
        }) as utils.types.ExtendShape<T, Augmentation>,
      typeName: 'ZodObject',
      uid: Symbol('ZodObject'),
    })
    return merged as IZodObject<utils.types.ExtendShape<T, Augmentation>, Incoming['_def']['unknownKeys']>
  }

  setKey<Key extends string, Schema extends IZodType>(
    key: Key,
    schema: Schema
  ): IZodObject<
    T & {
      [k in Key]: Schema
    },
    UnknownKeys
  > {
    return this.augment({ [key]: schema }) as IZodObject<
      T & {
        [k in Key]: Schema
      },
      UnknownKeys
    >
  }

  catchall<Index extends IZodType>(index: Index): IZodObject<T, Index> {
    return new ZodObjectImpl({
      ...this._def,
      unknownKeys: index,
    })
  }

  pick<
    Mask extends {
      [k in keyof T]?: true
    },
  >(mask: Mask): IZodObject<Pick<T, Extract<keyof T, keyof Mask>>, UnknownKeys> {
    const shape: Record<string, IZodType> = {}

    Object.keys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key]
      }
    })

    const objSchema: IZodObject<Pick<T, Extract<keyof T, keyof Mask>>, UnknownKeys> = new ZodObjectImpl({
      ...this._def,
      shape: () => shape as Pick<T, Extract<keyof T, keyof Mask>>,
      uid: Symbol('ZodObject'),
    })

    return objSchema
  }

  omit<
    Mask extends {
      [k in keyof T]?: true
    },
  >(mask: Mask): IZodObject<Omit<T, keyof Mask>, UnknownKeys> {
    const shape: Record<string, IZodType> = {}

    Object.entries(this.shape).forEach(([key, value]) => {
      if (!mask[key]) {
        shape[key] = value
      }
    })

    const objSchema: IZodObject<Omit<T, keyof Mask>, UnknownKeys> = new ZodObjectImpl({
      ...this._def,
      shape: () => shape as Omit<T, keyof Mask>,
      uid: Symbol('ZodObject'),
    })

    return objSchema
  }

  partial(): IZodObject<
    {
      [k in keyof T]: IZodOptional<T[k]>
    },
    UnknownKeys
  >
  partial<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): IZodObject<
    utils.types.NoNever<{
      [k in keyof T]: k extends keyof Mask ? IZodOptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  partial(mask?: {
    [k in keyof T]?: true
  }): IZodObject<ZodRawShape, UnknownKeys> {
    const newShape: Record<string, IZodType | undefined> = {}

    Object.keys(this.shape).forEach((key) => {
      const fieldSchema = this.shape[key]

      if (mask && !mask[key]) {
        newShape[key] = fieldSchema
      } else {
        newShape[key] = fieldSchema?.optional()
      }
    })

    const objSchema: IZodObject<ZodRawShape, UnknownKeys> = new ZodObjectImpl({
      ...this._def,
      shape: () => newShape as ZodRawShape,
      uid: Symbol('ZodObject'),
    })

    return objSchema
  }

  required(): IZodObject<
    {
      [k in keyof T]: Deoptional<T[k]>
    },
    UnknownKeys
  >
  required<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): IZodObject<
    utils.types.NoNever<{
      [k in keyof T]: k extends keyof Mask ? Deoptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  required(mask?: {
    [k in keyof T]?: true
  }): IZodObject<ZodRawShape, UnknownKeys> {
    const newShape: Record<string, IZodType> = {}

    Object.entries(this.shape).forEach(([key, value]) => {
      if (mask && !mask[key]) {
        newShape[key] = value
      } else {
        const fieldSchema = value

        let newField = fieldSchema!
        while (is.zuiOptional(newField)) {
          newField = newField._def.innerType
        }

        newShape[key] = newField
      }
    })

    return new ZodObjectImpl({
      ...this._def,
      shape: () => newShape,
      uid: Symbol('ZodObject'),
    }) as IZodObject<ZodRawShape, UnknownKeys>
  }

  keyof(): IZodEnum<KeyOfObject<T>> {
    const keys = Object.keys(this.shape) as [string, ...string[]]
    return builders.enum(keys) as IZodEnum<any>
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodObjectImpl)) return false
    if (!this._unknownKeysEqual(schema)) return false

    const thisUid = this._def.uid
    const otherUid = schema._def.uid
    let inProgress = ZodObjectImpl._comparing.get(thisUid)
    if (inProgress?.has(otherUid)) return true
    if (!inProgress) ZodObjectImpl._comparing.set(thisUid, (inProgress = new Set()))
    inProgress.add(otherUid)

    try {
      const thisShape = this._def.shape()
      const thatShape = schema._def.shape()

      type Property = [string, IZodType]
      const compare = (a: Property, b: Property) => a[0] === b[0] && a[1].isEqual(b[1])
      const thisProps = new utils.ds.CustomSet<Property>(Object.entries(thisShape), { compare })
      const thatProps = new utils.ds.CustomSet<Property>(Object.entries(thatShape), { compare })

      return thisProps.isEqual(thatProps)
    } finally {
      inProgress.delete(otherUid)
      if (inProgress.size === 0) ZodObjectImpl._comparing.delete(thisUid)
    }
  }

  private _unknownKeysEqual(that: ZodObjectImpl<any, any>): boolean {
    const thisAdditionalProperties = this.additionalProperties()
    const thatAdditionalProperties = that.additionalProperties()
    if (thisAdditionalProperties === undefined || thatAdditionalProperties === undefined) {
      return thisAdditionalProperties === thatAdditionalProperties
    }
    return thisAdditionalProperties.isEqual(thatAdditionalProperties)
  }
}
