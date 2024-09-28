import { unique } from '../../utils'
import {
  ZodBranded,
  ZodCatch,
  ZodDefault,
  ZodEnum,
  ZodIssueCode,
  input,
  output,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodRawShape,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  ZodLazy,
  ZodLiteral,
  ZodNativeEnum,
  ZodNull,
  ZodNullable,
  UnknownKeysParam,
  ZodObject,
  ZodOptional,
  ZodReadonly,
  ZodEffects,
  ZodUndefined,
  processCreateParams,
  util,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  Primitive,
} from '../index'

const getDiscriminator = <T extends ZodTypeAny>(type: T): Primitive[] => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema)
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType())
  } else if (type instanceof ZodLiteral) {
    return [type.value]
  } else if (type instanceof ZodEnum) {
    return type.options
  } else if (type instanceof ZodNativeEnum) {
    // eslint-disable-next-line ban/ban
    return util.objectValues(type.enum as any)
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
    [key in Discriminator]: ZodTypeAny
  } & ZodRawShape,
  UnknownKeysParam,
  ZodTypeAny
>

export interface ZodDiscriminatedUnionDef<
  Discriminator extends string,
  Options extends ZodDiscriminatedUnionOption<string>[] = ZodDiscriminatedUnionOption<string>[],
> extends ZodTypeDef {
  discriminator: Discriminator
  options: Options
  optionsMap: Map<Primitive, ZodDiscriminatedUnionOption<any>>
  typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion
}

export class ZodDiscriminatedUnion<
  Discriminator extends string,
  Options extends ZodDiscriminatedUnionOption<Discriminator>[],
> extends ZodType<output<Options[number]>, ZodDiscriminatedUnionDef<Discriminator, Options>, input<Options[number]>> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
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
    return unique(this.options.flatMap((option) => option.getReferences()))
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)

    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      })
      return INVALID
    }

    const discriminator = this.discriminator

    const discriminatorValue: string = ctx.data[discriminator]

    const option = this.optionsMap.get(discriminatorValue)

    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
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
      }) as any
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      }) as any
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
    params?: RawCreateParams,
  ): ZodDiscriminatedUnion<Discriminator, Types> {
    const optionsMap = ZodDiscriminatedUnion._getOptionsMap(discriminator, options)
    return new ZodDiscriminatedUnion<
      Discriminator,
      // DiscriminatorValue,
      Types
    >({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
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
    const optionsMap: Map<Primitive, Types[number]> = new Map()

    // try {
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator])
      if (!discriminatorValues.length) {
        throw new Error(
          `A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`,
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
}
