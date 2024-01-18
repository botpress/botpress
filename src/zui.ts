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
} from 'zod'

// eslint-disable-next-line no-duplicate-imports
import z from 'zod'
import { JsonFormElement } from './components'

export type Infer<
  T extends ZodType | ZuiType<any> | ZuiTypeAny,
  Out = T extends ZodType ? T['_output'] : T extends ZuiType<infer Z> ? Z['_output'] : never,
> = Out

export type ToZodType<T extends ZuiTypeAny> = T extends ZuiType<infer Z> ? Z : never

export type ZuiRawShape = { [k: string]: ZuiTypeAny }
export type ZuiTypeAny = ZuiType<any>
export type ZuiType<O extends ZodType, N extends ZuiExtension<O> = ZuiExtension<O>> = N & {
  [P in keyof O]: O[P] extends (...args: any) => O
    ? (...args: Parameters<O[P]>) => ZuiType<O, N>
    : P extends '_def'
    ? O[P] & { [zuiKey]: N['ui'] }
    : P extends 'optional'
    ? (...args: Parameters<O[P]>) => ZodOptional<O> & ZuiType<O, N>
    : P extends 'default'
    ? {
        (arg?: any): ZodDefault<O> & ZuiType<O, N>
        (...args: Parameters<O[P]>): ZodDefault<O> & ZuiType<O, N>
      }
    : O[P]
}

export type ZuiExtension<Z extends ZodType, Out = z.infer<Z>> = {
  /**
   * The type of component to use to display the field and its options
   */
  displayAs: <T extends JsonFormElement>(options: T) => ZuiType<Z>
  /**
   * Examples of valid values for the field
   * @default []
   */
  examples: (examples: Out[]) => ZuiType<Z>
  /**
   * Whether the field should fill the available space
   * @default false
   */
  fill: (fill: boolean) => ZuiType<Z>
  /**
   * Whether the field can be set dynamically using super inputs
   * @default false
   */
  dynamic: (dynamic: boolean) => ZuiType<Z>
  /**
   * The title of the field. Defaults to the field name.
   */
  title: (title: string) => ZuiType<Z>
  /**
   * Whether the field is hidden in the UI. Useful for internal fields.
   * @default false
   */
  hidden: (hidden: boolean) => ZuiType<Z>
  /**
   * Whether the field can be overriden by a more specific configuration
   * @default false
   */
  overridable: (overridable: boolean) => ZuiType<Z>
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled: (disabled: boolean) => ZuiType<Z>
  /**
   * Whether the field should show the description as a tooltip
   * @default true
   */
  tooltip: (tooltip: boolean) => ZuiType<Z>
  /**
   * Whether the field is readonly
   * @default false
   */
  readonly: (readonly: boolean) => ZuiType<Z>
  /**
   * Placeholder text for the field
   */
  placeholder: (placeholder: string) => ZuiType<Z>
  /**
   * Choose how the field & its childs are displayed
   */
  layout: (layout: 'HorizontalLayout' | 'VerticalLayout' | 'CollapsiblePanel') => ZuiType<Z>

  /**
   * Returns the ZUI schema for the field
   */
  get ui(): {
    [P in keyof Omit<ZuiExtension<Z>, 'ui'>]?: ZuiExtension<Z>[P] extends (...args: any) => ZuiType<Z>
      ? Parameters<ZuiExtension<Z>[P]>[0]
      : never
  }
}

export const zuiKey = 'x-zui' as const

const Extensions: ReadonlyArray<keyof ZuiExtension<any>> = [
  'tooltip',
  'disabled',
  'displayAs',
  'dynamic',
  'examples',
  'fill',
  'hidden',
  'readonly',
  'title',
  'placeholder',
  'overridable',
  'layout',
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
)

function extend<T extends ZCreate>(zType: T) {
  const instance = ((zType as any).prototype as any) ?? (zType as any)

  for (const extension of Extensions) {
    instance[extension] = function (props: unknown) {
      this._def[zuiKey] ??= {}
      this._def[zuiKey][extension] = props
      return this
    }
  }

  if (!instance.ui) {
    Object.defineProperty(instance, 'ui', {
      get() {
        this._def[zuiKey] ??= {}
        return this._def[zuiKey]
      },
    })
  }

  const stubWrapper = (name: string) => {
    const original = instance[name]
    if (original) {
      instance[name] = function (...args) {
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

type ZuiRecord = {
  <Keys extends ZodTypeAny, Value extends ZodTypeAny>(
    keySchema: ZodTypeAny,
    valueSchema: ZodTypeAny,
    params?: RecordArgs[2],
  ): ZuiType<ZodRecord<Keys, Value>>
  <Value extends ZodTypeAny>(valueSchema: ZodTypeAny, params?: RecordArgs[2]): ZuiType<ZodRecord<ZodString, Value>>
}

type Zui = {
  string: (params?: StringArgs[0]) => ZuiType<ZodString>
  number: (params?: NumberArgs[0]) => ZuiType<ZodNumber>
  boolean: (params?: BooleanArgs[0]) => ZuiType<ZodBoolean>
  literal: (value: LiteralArgs[0], params?: LiteralArgs[1]) => ZuiType<ZodLiteral<any>>
  array: <T extends ZodTypeAny>(schema: T, params?: ArrayArgs[1]) => ZuiType<ZodArray<T>>
  object: <T extends ZodRawShape>(shape: T, params?: ObjectArgs[1]) => ZuiType<ZodObject<T>> & ZodObject<T>
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
  ) => ZuiType<ZodDiscriminatedUnion<Discriminator, Types>>
  record: ZuiRecord
  optional: (type: OptionalArgs[0], params?: OptionalArgs[1]) => ZuiType<ZodOptional<any>>
  enum: <U extends string, T extends Readonly<[U, ...U[]]>>(
    values: T,
    params?: EnumArgs[1],
  ) => ZuiType<ZodEnum<Writeable<T>>>
}

const zui: Zui = {
  string: (params) => z.string(params) as unknown as ZuiType<ZodString>,
  number: (params) => z.number(params) as unknown as ZuiType<ZodNumber>,
  boolean: (params) => z.boolean(params) as unknown as ZuiType<ZodBoolean>,
  literal: (value, params) => z.literal(value, params) as unknown as ZuiType<ZodLiteral<any>>,
  optional: (type, params) => z.optional(type, params) as unknown as ZuiType<ZodOptional<any>>,

  array: <T extends ZodTypeAny>(schema: T, params?: ArrayArgs[1]) =>
    z.array(schema, params) as unknown as ZuiType<ZodArray<T>>,

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
}

export { zui }
