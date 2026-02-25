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
} from '../../typings'
import * as utils from '../../utils'
import {
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseStatus,
  ParseInputLazyPath,
  ZodBaseTypeImpl,
  type MergeObjectPair,
  ParseReturnType,
} from '../basetype'

import { ZodNativeType } from '../../native'

import { builders } from '../../internal-builders'

/**
 * @deprecated use ZodObject instead
 */
export type SomeZodObject = ZodObjectImpl<ZodRawShape, UnknownKeysParam>

/**
 * @deprecated use ZodObject instead
 */
export type AnyZodObject = ZodObjectImpl<any, any>

export class ZodObjectImpl<
    T extends ZodRawShape = ZodRawShape,
    UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
    Output = ObjectOutputType<T, UnknownKeys>,
    Input = ObjectInputType<T, UnknownKeys>,
  >
  extends ZodBaseTypeImpl<Output, ZodObjectDef<T, UnknownKeys>, Input>
  implements IZodObject<T, UnknownKeys, Output, Input>
{
  /** Safe cast: ZodObject structurally satisfies IZodObject but TS can't prove it due to recursive type depth */

  private _cached: { shape: T; keys: string[] } | null = null

  _getCached(): { shape: T; keys: string[] } {
    if (this._cached !== null) return this._cached
    const shape = this._def.shape()
    const keys = Object.keys(shape)
    return (this._cached = { shape, keys })
  }

  dereference(defs: Record<string, IZodType>): IZodType {
    const currentShape = this._def.shape()
    const shape: Record<string, IZodType> = {}
    for (const key in currentShape) {
      shape[key] = currentShape[key]!.dereference(defs)
    }
    return new ZodObjectImpl({
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

  clone(): IZodObject<T, UnknownKeys, Output, Input> {
    const newShape: Record<string, IZodType> = {}
    const currentShape = this._def.shape()
    for (const [key, value] of Object.entries(currentShape)) {
      newShape[key] = value.clone()
    }
    const objSchema = new ZodObjectImpl<T, UnknownKeys, Output, Input>({
      ...this._def,
      shape: () => newShape as T,
    })

    return objSchema
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
        value: ZodBaseTypeImpl.fromInterface(keyValidator)._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
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
          value: ZodBaseTypeImpl.fromInterface(unknownKeys)._parse(
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
      return ParseStatus.mergeObjectSync(status, pairs as MergeObjectPair[])
    }
  }

  get shape() {
    return this._def.shape()
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
      return builders.any() as unknown as AdditionalProperties<UnknownKeys>
    }
    if (this._def.unknownKeys === 'strict') {
      return builders.never() as unknown as AdditionalProperties<UnknownKeys>
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
    const merged: any = new ZodObjectImpl({
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
  // ): IZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObjectImpl({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       utils.types.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: 'ZodObject',
  //   });
  //   return merged;
  // }
  setKey<Key extends string, Schema extends IZodType>(
    key: Key,
    schema: Schema
  ): IZodObject<
    T & {
      [k in Key]: Schema
    },
    UnknownKeys
  > {
    return this.augment({ [key]: schema }) as unknown as IZodObject<
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
  //   const merged: any = new ZodObjectImpl({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       utils.types.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: 'ZodObject',
  //   });
  //   return merged;
  // }
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
    const shape: any = {}

    Object.keys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key]
      }
    })

    const objSchema: IZodObject<Pick<T, Extract<keyof T, keyof Mask>>, UnknownKeys> = new ZodObjectImpl({
      ...this._def,
      shape: () => shape as Pick<T, Extract<keyof T, keyof Mask>>,
    })

    return objSchema
  }

  omit<
    Mask extends {
      [k in keyof T]?: true
    },
  >(mask: Mask): IZodObject<Omit<T, keyof Mask>, UnknownKeys> {
    const shape: any = {}

    Object.keys(this.shape).forEach((key) => {
      if (!mask[key]) {
        shape[key] = this.shape[key]
      }
    })

    const objSchema: IZodObject<Omit<T, keyof Mask>, UnknownKeys> = new ZodObjectImpl({
      ...this._def,
      shape: () => shape as Omit<T, keyof Mask>,
    })

    return objSchema
  }

  /**
   * @deprecated
   */
  deepPartial(): any {
    return this._deepPartialify(this)
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
  partial(mask?: any): IZodObject<any, UnknownKeys> {
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
  required(mask?: any): IZodObject {
    const newShape: any = {}

    Object.keys(this.shape).forEach((key) => {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key]
      } else {
        const fieldSchema = this.shape[key]
        let newField = fieldSchema as ZodNativeType

        while (newField.typeName === 'ZodOptional') {
          newField = (newField as IZodOptional<any>)._def.innerType
        }

        newShape[key] = newField
      }
    })

    return new ZodObjectImpl({
      ...this._def,
      shape: () => newShape,
    })
  }

  keyof(): IZodEnum<KeyOfObject<T>> {
    const keys = Object.keys(this.shape) as [string, ...string[]]
    return builders.enum(keys) as IZodEnum<any>
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodObjectImpl)) return false
    if (!this._unknownKeysEqual(schema)) return false

    const thisShape = this._def.shape()
    const thatShape = schema._def.shape()

    type Property = [string, IZodType]
    const compare = (a: Property, b: Property) => a[0] === b[0] && a[1].isEqual(b[1])
    const thisProps = new utils.ds.CustomSet<Property>(Object.entries(thisShape), { compare })
    const thatProps = new utils.ds.CustomSet<Property>(Object.entries(thatShape), { compare })

    return thisProps.isEqual(thatProps)
  }

  private _unknownKeysEqual(that: IZodObject): boolean {
    const thisAdditionalProperties = this.additionalProperties()
    const thatAdditionalProperties = that.additionalProperties()
    if (thisAdditionalProperties === undefined || thatAdditionalProperties === undefined) {
      return thisAdditionalProperties === thatAdditionalProperties
    }
    return thisAdditionalProperties.isEqual(thatAdditionalProperties)
  }

  private _deepPartialify(_schema: IZodType): IZodType {
    const schema = _schema as ZodNativeType
    if (schema.typeName === 'ZodObject') {
      const newShape: Record<string, IZodType> = {}

      for (const [key, fieldSchema] of Object.entries(schema.shape)) {
        newShape[key] = builders.optional(this._deepPartialify(fieldSchema))
      }

      return new ZodObjectImpl({
        ...schema._def,
        shape: () => newShape,
      })
    } else if (schema.typeName === 'ZodArray') {
      const element = this._deepPartialify(schema.element)
      const newArray = schema.clone()
      newArray._def.type = element // TODO: allow cloning with modifications to avoid this mutation
      return newArray
    } else if (schema.typeName === 'ZodOptional') {
      return builders.optional(this._deepPartialify(schema.unwrap()))
    } else if (schema.typeName === 'ZodNullable') {
      return builders.nullable(this._deepPartialify(schema.unwrap()))
    } else if (schema.typeName === 'ZodTuple') {
      const partialItems = schema.items.map((item) => this._deepPartialify(item)) as [IZodType, ...IZodType[]]
      return builders.tuple(partialItems)
    } else {
      return schema
    }
  }
}
