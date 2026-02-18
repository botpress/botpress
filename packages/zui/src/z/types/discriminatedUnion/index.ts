import * as utils from '../../utils'
import {
  input,
  output,
  RawCreateParams,
  ZodRawShape,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
} from '../basetype'
import {
  ZodBranded,
  ZodCatch,
  ZodDefault,
  ZodEnum,
  ZodLazy,
  ZodLiteral,
  ZodNativeEnum,
  ZodNull,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodReadonly,
  ZodEffects,
  ZodUndefined,
  UnknownKeysParam,
} from '../index'

const getDiscriminator = <T extends ZodType>(type: T): utils.types.Primitive[] => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema)
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType())
  } else if (type instanceof ZodLiteral) {
    return [type.value]
  } else if (type instanceof ZodEnum) {
    return type.options
  } else if (type instanceof ZodNativeEnum) {
    return Object.values(type.enum)
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType)
  } else if (type instanceof ZodUndefined) {
    return [undefined]
  } else if (type instanceof ZodNull) {
    return [null]
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())]
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())]
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap())
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap())
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType)
  } else {
    return []
  }
}

export type ZodDiscriminatedUnionOption<Discriminator extends string> = ZodObject<
  {
    [key in Discriminator]: ZodType
  } & ZodRawShape,
  UnknownKeysParam
>

export type ZodDiscriminatedUnionDef<
  Discriminator extends string = string,
  Options extends ZodDiscriminatedUnionOption<string>[] = ZodDiscriminatedUnionOption<string>[],
> = {
  discriminator: Discriminator
  options: Options
  optionsMap: Map<utils.types.Primitive, ZodDiscriminatedUnionOption<any>>
  typeName: 'ZodDiscriminatedUnion'
} & ZodTypeDef

export class ZodDiscriminatedUnion<
  Discriminator extends string = string,
  Options extends ZodDiscriminatedUnionOption<Discriminator>[] = ZodDiscriminatedUnionOption<Discriminator>[],
> extends ZodType<output<Options[number]>, ZodDiscriminatedUnionDef<Discriminator, Options>, input<Options[number]>> {
  dereference(defs: Record<string, ZodType>): ZodType {
    const options = this.options.map((option) => option.dereference(defs)) as [
      ZodDiscriminatedUnionOption<Discriminator>,
      ...ZodDiscriminatedUnionOption<Discriminator>[],
    ]

    const optionsMap = ZodDiscriminatedUnion._getOptionsMap(this.discriminator, options)

    return new ZodDiscriminatedUnion({
      ...this._def,
      options,
      optionsMap,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique(this.options.flatMap((option) => option.getReferences()))
  }

  clone(): ZodDiscriminatedUnion<Discriminator, Options> {
    const options: ZodDiscriminatedUnionOption<Discriminator>[] = this.options.map(
      (option) => option.clone() as ZodDiscriminatedUnionOption<Discriminator>
    )
    return new ZodDiscriminatedUnion({
      ...this._def,
      options: options as [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
    }) as ZodDiscriminatedUnion<Discriminator, any>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)

    if (ctx.parsedType !== 'object') {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'object',
        received: ctx.parsedType,
      })
      return INVALID
    }

    const discriminator = this.discriminator

    const discriminatorValue: string = ctx.data[discriminator]

    const option = this.optionsMap.get(discriminatorValue)

    if (!option) {
      addIssueToContext(ctx, {
        code: 'invalid_union_discriminator',
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator],
      })
      return INVALID
    }

    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      }) as ParseReturnType<this['_output']>
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      }) as ParseReturnType<this['_output']>
    }
  }

  get discriminator() {
    return this._def.discriminator
  }

  get options() {
    return this._def.options
  }

  get optionsMap() {
    return this._def.optionsMap
  }

  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create<
    Discriminator extends string,
    Types extends [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
  >(
    discriminator: Discriminator,
    options: Types,
    params?: RawCreateParams
  ): ZodDiscriminatedUnion<Discriminator, Types> {
    const optionsMap = ZodDiscriminatedUnion._getOptionsMap(discriminator, options)
    return new ZodDiscriminatedUnion<
      Discriminator,
      // DiscriminatorValue,
      Types
    >({
      typeName: 'ZodDiscriminatedUnion',
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params),
    })
  }

  private static _getOptionsMap<
    Discriminator extends string,
    Types extends [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
  >(discriminator: Discriminator, options: Types) {
    // Get all the valid discriminator values
    const optionsMap: Map<utils.types.Primitive, Types[number]> = new Map()

    // try {
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator])
      if (!discriminatorValues.length) {
        throw new Error(
          `A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`
        )
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`)
        }

        optionsMap.set(value, type)
      }
    }

    return optionsMap
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodDiscriminatedUnion)) return false
    if (this._def.discriminator !== schema._def.discriminator) return false

    const compare = (a: ZodObject, b: ZodObject) => a.isEqual(b)
    const thisOptions = new utils.ds.CustomSet<ZodObject>(this._def.options, { compare })
    const thatOptions = new utils.ds.CustomSet<ZodObject>(schema._def.options, { compare })

    // no need to compare optionsMap, as it is derived from discriminator + options

    return thisOptions.isEqual(thatOptions)
  }
}
