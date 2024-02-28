import type {
  ZodRawShape,
  Writeable,
  ZodType,
  ZodTypeAny,
  ZodUnion,
  ZodObject,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodArray,
  ZodLiteral,
  ZodDiscriminatedUnionOption,
  ZodDiscriminatedUnion,
  ZodOptional,
  ZodEnum,
  ZodDefault,
  ZodRecord,
  ZodAny,
  ZodUnknown,
  ZodNull,
  ZodLazy,
} from 'zod'

// eslint-disable-next-line no-duplicate-imports
import { z } from 'zod'
import { ZuiSchemaOptions, getZuiSchemas } from './zui-schemas'
import { GlobalComponentDefinitions, JsonSchema7, jsonSchemaToZui } from '.'
import { ObjectToZuiOptions, objectToZui } from './object-to-zui'
import type { UIComponentDefinitions, ZodToBaseType } from './ui/types'

export type Infer<
  T extends ZodType | ZuiType<any> | ZuiTypeAny,
  Out = T extends ZodType ? T['_output'] : T extends ZuiType<infer Z> ? Z['_output'] : never,
> = Out

export type ToZodType<T extends ZuiTypeAny> = T extends ZuiType<infer Z> ? Z : never

export type ZuiRawShape = { [k: string]: ZuiTypeAny }
export type ZuiTypeAny = ZuiType<any>

export type ZuiType<
  O extends ZodType,
  UI extends UIComponentDefinitions = GlobalComponentDefinitions,
  N extends ZuiExtension<O, any> = ZuiExtension<O, UI>,
> = N & {
  [P in keyof O]: O[P] extends (...args: any) => O
    ? (...args: Parameters<O[P]>) => ZuiType<O, UI, N>
    : P extends '_def'
      ? O[P] & { [zuiKey]: N['ui'] }
      : P extends 'optional'
        ? (...args: Parameters<O[P]>) => ZodOptional<O> & ZuiType<O, UI, N>
        : P extends 'default'
          ? {
              (arg?: any): ZodDefault<O> & ZuiType<O, UI, N>
              (...args: Parameters<O[P]>): ZodDefault<O> & ZuiType<O, UI, N>
            }
          : O[P]
}

export type ZuiExtension<Z extends ZodType, UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  /**
   * The type of component to use to display the field and its options
   */
  displayAs: <K extends keyof UI[ZodToBaseType<Z>]>(
    id: K,
    options: z.infer<UI[ZodToBaseType<Z>][K]['schema']>,
  ) => ZuiType<Z, UI>
  /**
   * The title of the field. Defaults to the field name.
   */
  title: (title: string) => ZuiType<Z, UI>
  /**
   * Whether the field is hidden in the UI. Useful for internal fields.
   * @default false
   */
  hidden: (hidden?: boolean) => ZuiType<Z, UI>
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled: (disabled?: boolean) => ZuiType<Z, UI>
  /**
   * Whether the field should show the description as a tooltip
   * @default true
   */
  tooltip: (text: string) => ZuiType<Z, UI>
  /**
   * Placeholder text for the field
   */
  placeholder: (placeholder: string) => ZuiType<Z, UI>
  /**
   * Returns the ZUI schema for the field
   */
  get ui(): {
    [P in keyof Omit<ZuiExtension<Z, UI>, 'ui'>]?: ZuiExtension<Z, UI>[P] extends (...args: any) => ZuiType<Z, UI>
      ? Parameters<ZuiExtension<Z, UI>[P]>[0]
      : never
  }
  toJsonSchema(options?: ZuiSchemaOptions): any //TODO: fix typings, JsonSchema7 doesn't work well when consuming it
}

export const zuiKey = 'x-zui' as const

const Extensions: ReadonlyArray<keyof ZuiExtension<any, any>> = [
  'tooltip',
  'disabled',
  'displayAs',
  'hidden',
  'title',
  'placeholder',
] as const

type ZCreate = { create: (...args: any) => ZodType } & (
  | typeof z.ZodString
  | typeof z.ZodBoolean
  | typeof z.ZodNumber
  | typeof z.ZodArray
  | typeof z.ZodObject
  | typeof z.ZodUnion
  | typeof z.ZodDiscriminatedUnion
  | typeof z.ZodRecord
  | typeof z.ZodEnum
  | typeof z.ZodOptional
  | typeof z.ZodDefault
  | typeof z.ZodLiteral
  | typeof z.ZodAny
  | typeof z.ZodUnknown
  | typeof z.ZodNull
  | typeof z.ZodLazy
)

function extend<T extends ZCreate | ZodLazy<any>>(zType: T) {
  const instance = ((zType as any).prototype as any) ?? (zType as any)

  for (const extension of Extensions) {
    instance[extension] = function (...props: unknown[]) {
      this._def[zuiKey] ??= {}

      if (Array.isArray(props) && props.length > 1) {
        this._def[zuiKey][extension] = props
      } else if (props.length === 1) {
        this._def[zuiKey][extension] = props[0]
      } else {
        this._def[zuiKey][extension] = true
      }
      return this
    }
  }

  if (zType instanceof z.ZodLazy) {
    const original = zType._def.getter
    zType._def.getter = () => {
      const schema = original()
      extend(schema)
      return schema
    }
  }

  if (!instance.ui) {
    Object.defineProperty(instance, 'ui', {
      get() {
        // TODO: find out why this happens
        if (!this._def) {
          console.warn('Could not read _def from object')
          return {}
        }
        this._def[zuiKey] ??= {}
        return this._def[zuiKey]
      },
    })
  }

  if (!instance.toJsonSchema) {
    instance.toJsonSchema = function (options?: ZuiSchemaOptions) {
      return getZuiSchemas(this, options).schema
    }
  }

  const stubWrapper = (name: string) => {
    const original = instance[name]
    if (original) {
      instance[name] = function (...args: any[]) {
        const ret = original.apply(this, args)
        extend(ret)
        ret._def[zuiKey] = this?._def?.[zuiKey]
        return ret
      }
    }
  }

  stubWrapper('default')
  stubWrapper('optional')
  stubWrapper('nullable')
  stubWrapper('nullish')
}

extend(z.ZodString)
extend(z.ZodNumber)
extend(z.ZodBoolean)
extend(z.ZodArray)
extend(z.ZodObject)
extend(z.ZodUnion)
extend(z.ZodDiscriminatedUnion)
extend(z.ZodLiteral)
extend(z.ZodEnum)
extend(z.ZodOptional)
extend(z.ZodDefault)
extend(z.ZodAny)
extend(z.ZodUnknown)
extend(z.ZodNull)
extend(z.ZodLazy)

type StringArgs = Parameters<typeof z.string>
type NumberArgs = Parameters<typeof z.number>
type BooleanArgs = Parameters<typeof z.boolean>
type LiteralArgs = Parameters<typeof z.literal>
type ArrayArgs = Parameters<typeof z.array>
type ObjectArgs = Parameters<typeof z.object>
type UnionArgs = Parameters<typeof z.union>
type DiscriminatedUnionArgs = Parameters<typeof z.discriminatedUnion>
type RecordArgs = Parameters<typeof z.record>
type OptionalArgs = Parameters<typeof z.optional>
type EnumArgs = Parameters<typeof z.enum>
type AnyArgs = Parameters<typeof z.any>
type UnknownArgs = Parameters<typeof z.unknown>
type NullArgs = Parameters<typeof z.null>

type ZuiRecord = {
  <Keys extends ZodTypeAny, Value extends ZodTypeAny>(
    keySchema: ZodTypeAny,
    valueSchema: ZodTypeAny,
    params?: RecordArgs[2],
  ): ZuiType<ZodRecord<Keys, Value>>
  <Value extends ZodTypeAny>(valueSchema: ZodTypeAny, params?: RecordArgs[2]): ZuiType<ZodRecord<ZodString, Value>>
}

export type Zui<UI extends UIComponentDefinitions = GlobalComponentDefinitions> = {
  string: (params?: StringArgs[0]) => ZuiType<ZodString, UI>
  number: (params?: NumberArgs[0]) => ZuiType<ZodNumber, UI>
  boolean: (params?: BooleanArgs[0]) => ZuiType<ZodBoolean, UI>
  literal: (value: LiteralArgs[0], params?: LiteralArgs[1]) => ZuiType<ZodLiteral<any>, UI>
  array: <T extends ZodTypeAny>(
    schema: T,
    params?: ArrayArgs[1],
  ) => ZuiType<ZodArray<T, 'many'>, UI> & ZodArray<T, 'many'>
  object: <T extends ZodRawShape>(shape: T, params?: ObjectArgs[1]) => ZuiType<ZodObject<T>, UI> & ZodObject<T>
  union: <T extends readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]>(
    types: T,
    params?: UnionArgs[1],
  ) => ZuiType<ZodUnion<T>>
  discriminatedUnion: <
    Discriminator extends string,
    Types extends [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
  >(
    discriminator: Discriminator,
    options: Types,
    params?: DiscriminatedUnionArgs[2],
  ) => ZuiType<ZodDiscriminatedUnion<Discriminator, Types>, UI>
  record: ZuiRecord
  optional: (type: OptionalArgs[0], params?: OptionalArgs[1]) => ZuiType<ZodOptional<any>, UI>
  enum: <U extends string, T extends Readonly<[U, ...U[]]>>(
    values: T,
    params?: EnumArgs[1],
  ) => ZuiType<ZodEnum<Writeable<T>>, UI>
  any: (params?: AnyArgs[0]) => ZuiType<ZodAny>
  unknown: (params?: UnknownArgs[0]) => ZuiType<ZodUnknown>
  null: (params?: NullArgs[0]) => ZuiType<ZodNull>
  lazy: <T extends ZodTypeAny>(schema: () => T) => ZuiType<ZodLazy<T>, UI>
  fromJsonSchema(schema: JsonSchema7): ZuiType<ZodAny>
  fromObject(object: any, options?: ObjectToZuiOptions): ZuiType<ZodAny>
}

const zui: Zui<GlobalComponentDefinitions> = {
  string: (params) => z.string(params) as unknown as ZuiType<ZodString>,
  number: (params) => z.number(params) as unknown as ZuiType<ZodNumber>,
  boolean: (params) => z.boolean(params) as unknown as ZuiType<ZodBoolean>,
  literal: (value, params) => z.literal(value, params) as unknown as ZuiType<ZodLiteral<any>>,
  optional: (type, params) => z.optional(type, params) as unknown as ZuiType<ZodOptional<any>>,

  array: <T extends ZodTypeAny>(schema: T, params?: ArrayArgs[1]) =>
    z.array(schema, params) as unknown as ZuiType<ZodArray<T, 'many'>> & ZodArray<T, 'many'>,

  object: <T extends ZodRawShape>(shape: T, params?: ObjectArgs[1]) =>
    z.object(shape as ZodRawShape, params) as ZodObject<T> & ZuiType<ZodObject<T>>,

  union: <T extends readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]>(types: T, params?: UnionArgs[1]) =>
    z.union(types, params) as unknown as ZuiType<ZodUnion<T>>,

  discriminatedUnion: <
    Discriminator extends string,
    Types extends [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
  >(
    discriminator: Discriminator,
    options: Types,
    params?: DiscriminatedUnionArgs[2],
  ) =>
    z.discriminatedUnion(discriminator, options as any, params) as unknown as ZuiType<
      ZodDiscriminatedUnion<Discriminator, Types>
    >,

  record: <Keys extends ZodTypeAny, Value extends ZodTypeAny>(
    keySchema: Keys,
    valueSchema: Value,
    params?: RecordArgs[2],
  ) => z.record(keySchema, valueSchema, params) as unknown as ZuiType<ZodRecord<Keys, Value>>,

  enum: <U extends string, T extends Readonly<[U, ...U[]]>>(values: T, params?: EnumArgs[1]) =>
    z.enum(values as any, params) as unknown as ZuiType<ZodEnum<Writeable<T>>>,

  any: (params) => z.any(params) as unknown as ZuiType<ZodAny>,
  unknown: (params) => z.unknown(params) as unknown as ZuiType<ZodUnknown>,
  null: (params) => z.null(params) as unknown as ZuiType<ZodNull>,

  lazy: <T extends ZodTypeAny>(schema: () => T) => {
    const lazySchema = z.lazy(schema)
    extend(lazySchema)
    return lazySchema as unknown as ZuiType<ZodLazy<T>>
  },

  fromJsonSchema: (schema) => jsonSchemaToZui(schema) as unknown as ZuiType<ZodAny>,
  fromObject: (object, options) => objectToZui(object, options) as unknown as ZuiType<ZodAny>,
}

export { zui }
