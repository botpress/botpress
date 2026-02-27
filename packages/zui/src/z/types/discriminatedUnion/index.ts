import type {
  IZodBaseType,
  IZodDiscriminatedUnion,
  ZodDiscriminatedUnionDef,
  ZodDiscriminatedUnionOption,
  input,
  output,
  IZodObject,
  Primitive,
  ZodType,
} from '../../typings'
import * as utils from '../../utils'
import { ZodBaseTypeImpl, addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../basetype'

const getDiscriminator = (_type: IZodBaseType | undefined): Primitive[] => {
  const type = _type as ZodType | undefined
  if (!type) return []
  if (type.typeName === 'ZodLazy') {
    return getDiscriminator(type.schema)
  } else if (type.typeName === 'ZodEffects') {
    return getDiscriminator(type.innerType())
  } else if (type.typeName === 'ZodLiteral') {
    return [type.value]
  } else if (type.typeName === 'ZodEnum') {
    return type.options
  } else if (type.typeName === 'ZodNativeEnum') {
    return Object.values(type.enum)
  } else if (type.typeName === 'ZodDefault') {
    return getDiscriminator(type._def.innerType)
  } else if (type.typeName === 'ZodUndefined') {
    return [undefined]
  } else if (type.typeName === 'ZodNull') {
    return [null]
  } else if (type.typeName === 'ZodOptional') {
    return [undefined, ...getDiscriminator(type.unwrap())]
  } else if (type.typeName === 'ZodNullable') {
    return [null, ...getDiscriminator(type.unwrap())]
  } else if (type.typeName === 'ZodBranded') {
    return getDiscriminator(type.unwrap())
  } else if (type.typeName === 'ZodReadonly') {
    return getDiscriminator(type.unwrap())
  } else if (type.typeName === 'ZodCatch') {
    return getDiscriminator(type._def.innerType)
  } else {
    return []
  }
}

export class ZodDiscriminatedUnionImpl<
    Discriminator extends string = string,
    Options extends ZodDiscriminatedUnionOption<Discriminator>[] = ZodDiscriminatedUnionOption<Discriminator>[],
  >
  extends ZodBaseTypeImpl<
    output<Options[number]>,
    ZodDiscriminatedUnionDef<Discriminator, Options>,
    input<Options[number]>
  >
  implements IZodDiscriminatedUnion<Discriminator, Options>
{
  constructor(def: utils.types.SafeOmit<ZodDiscriminatedUnionDef<Discriminator, Options>, 'optionsMap'>) {
    const optionsMap = ZodDiscriminatedUnionImpl._getOptionsMap(def.discriminator, def.options)
    super({
      ...def,
      optionsMap,
    })
  }

  dereference(defs: Record<string, IZodBaseType>): ZodBaseTypeImpl {
    const options = this.options.map((option) => option.dereference(defs)) as [
      ZodDiscriminatedUnionOption<Discriminator>,
      ...ZodDiscriminatedUnionOption<Discriminator>[],
    ]
    return new ZodDiscriminatedUnionImpl({
      ...this._def,
      options,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique(this.options.flatMap((option) => option.getReferences()))
  }

  clone(): ZodDiscriminatedUnionImpl<Discriminator, Options> {
    const options = this.options.map((option) => option.clone() as ZodDiscriminatedUnionOption<Discriminator>)
    return new ZodDiscriminatedUnionImpl({
      ...this._def,
      options: options as [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
    }) as ZodDiscriminatedUnionImpl<Discriminator, any>
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
      return ZodBaseTypeImpl.fromInterface(option)._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      }) as ParseReturnType<this['_output']>
    } else {
      return ZodBaseTypeImpl.fromInterface(option)._parseSync({
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
  private static _getOptionsMap<
    Discriminator extends string = string,
    Options extends ZodDiscriminatedUnionOption<Discriminator>[] = ZodDiscriminatedUnionOption<Discriminator>[],
  >(discriminator: Discriminator, options: Options) {
    // Get all the valid discriminator values
    const optionsMap: Map<Primitive, Options[number]> = new Map()

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

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodDiscriminatedUnionImpl)) return false
    if (this._def.discriminator !== schema._def.discriminator) return false

    const compare = (a: IZodObject, b: IZodObject) => a.isEqual(b)
    const thisOptions = new utils.ds.CustomSet<IZodObject>(this._def.options, { compare })
    const thatOptions = new utils.ds.CustomSet<IZodObject>(schema._def.options, { compare })

    // no need to compare optionsMap, as it is derived from discriminator + options

    return thisOptions.isEqual(thatOptions)
  }
}
