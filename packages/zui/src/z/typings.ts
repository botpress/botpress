import { Cast, UnionToTuple, NoNever, Flatten, NoUndefined, Primitive, SafeOmit, Writeable } from './utils/type-utils'
import type * as transforms from '../transforms'

//* ─────────────────────────── UI & Metadata ───────────────────────────────

export type ZuiMetadata =
  | string
  | number
  | boolean
  | null
  | undefined
  | ZuiMetadata[]
  | {
      [key: string]: ZuiMetadata
    }

export type ZuiExtensionObject = {
  tooltip?: boolean
  displayAs?: [string, any]
  title?: string
  disabled?: boolean | string
  hidden?: boolean | string
  placeholder?: string
  secret?: boolean
  coerce?: boolean
  [key: string]: ZuiMetadata
}

export type BaseDisplayAsType = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'discriminatedUnion'
export type UIComponentDefinitions = {
  [T in BaseDisplayAsType]: {
    [K: string]: {
      id: string
      params: IZodObject<any>
    }
  }
}

export type ZodKindToBaseType<U extends ZodTypeDef> = U extends ZodStringDef
  ? 'string'
  : U extends ZodNumberDef
    ? 'number'
    : U extends ZodBooleanDef
      ? 'boolean'
      : U extends ZodArrayDef
        ? 'array'
        : U extends ZodObjectDef
          ? 'object'
          : U extends ZodTupleDef
            ? never
            : U extends ZodEnumDef
              ? 'string'
              : U extends ZodDefaultDef
                ? ZodKindToBaseType<U['innerType']['_def']>
                : U extends ZodOptionalDef
                  ? ZodKindToBaseType<U['innerType']['_def']>
                  : U extends ZodNullableDef
                    ? ZodKindToBaseType<U['innerType']['_def']>
                    : U extends ZodDiscriminatedUnionDef
                      ? 'discriminatedUnion'
                      : never

export type DisplayAsOptions<U> = U extends { id: string; params: IZodObject }
  ? {
      id: U['id']
      params: TypeOf<U['params']>
    }
  : object

//* ─────────────────────────── Errors & Issues ───────────────────────────────

export type ErrMessage =
  | string
  | {
      message?: string
    }

type _ZodIssueBase = {
  path: (string | number)[]
  message?: string
}

export type ZodInvalidTypeIssue = {
  code: 'invalid_type'
  expected: ZodParsedType
  received: ZodParsedType
} & _ZodIssueBase

export type ZodInvalidLiteralIssue = {
  code: 'invalid_literal'
  expected: unknown
  received: unknown
} & _ZodIssueBase

export type ZodUnrecognizedKeysIssue = {
  code: 'unrecognized_keys'
  keys: string[]
} & _ZodIssueBase

export type ZodInvalidUnionIssue = {
  code: 'invalid_union'
  unionErrors: IZodError[]
} & _ZodIssueBase

export type ZodInvalidUnionDiscriminatorIssue = {
  code: 'invalid_union_discriminator'
  options: Primitive[]
} & _ZodIssueBase

export type ZodInvalidEnumValueIssue = {
  received: string | number
  code: 'invalid_enum_value'
  options: (string | number)[]
} & _ZodIssueBase

export type ZodInvalidArgumentsIssue = {
  code: 'invalid_arguments'
  argumentsError: IZodError
} & _ZodIssueBase

export type ZodInvalidReturnTypeIssue = {
  code: 'invalid_return_type'
  returnTypeError: IZodError
} & _ZodIssueBase

export type ZodInvalidDateIssue = {
  code: 'invalid_date'
} & _ZodIssueBase

export type ZodInvalidStringIssue = {
  code: 'invalid_string'
  validation:
    | 'email'
    | 'url'
    | 'emoji'
    | 'uuid'
    | 'regex'
    | 'cuid'
    | 'cuid2'
    | 'ulid'
    | 'datetime'
    | 'ip'
    | {
        includes: string
        position?: number
      }
    | {
        startsWith: string
      }
    | {
        endsWith: string
      }
} & _ZodIssueBase

export type ZodTooSmallIssue = {
  code: 'too_small'
  minimum: number | bigint
  inclusive: boolean
  exact?: boolean
  type: 'array' | 'string' | 'number' | 'set' | 'date' | 'bigint'
} & _ZodIssueBase

export type ZodTooBigIssue = {
  code: 'too_big'
  maximum: number | bigint
  inclusive: boolean
  exact?: boolean
  type: 'array' | 'string' | 'number' | 'set' | 'date' | 'bigint'
} & _ZodIssueBase

export type ZodInvalidIntersectionTypesIssue = {
  code: 'invalid_intersection_types'
} & _ZodIssueBase

export type ZodNotMultipleOfIssue = {
  code: 'not_multiple_of'
  multipleOf: number | bigint
} & _ZodIssueBase

export type ZodNotFiniteIssue = {
  code: 'not_finite'
} & _ZodIssueBase

export type ZodUnresolvedReferenceIssue = {
  code: 'unresolved_reference'
} & _ZodIssueBase

export type ZodCustomIssue = {
  code: 'custom'
  params?: {
    [k: string]: any
  }
} & _ZodIssueBase

type _ZodIssueOptionalMessage =
  | ZodInvalidTypeIssue
  | ZodInvalidLiteralIssue
  | ZodUnrecognizedKeysIssue
  | ZodInvalidUnionIssue
  | ZodInvalidUnionDiscriminatorIssue
  | ZodInvalidEnumValueIssue
  | ZodInvalidArgumentsIssue
  | ZodInvalidReturnTypeIssue
  | ZodInvalidDateIssue
  | ZodInvalidStringIssue
  | ZodTooSmallIssue
  | ZodTooBigIssue
  | ZodInvalidIntersectionTypesIssue
  | ZodNotMultipleOfIssue
  | ZodNotFiniteIssue
  | ZodUnresolvedReferenceIssue
  | ZodCustomIssue

export type ZodIssue = _ZodIssueOptionalMessage & {
  fatal?: boolean
  message: string
}

export type CustomErrorParams = Partial<SafeOmit<ZodCustomIssue, 'code'>>

type _RecursiveZodFormattedError<T> = T extends [any, ...any[]]
  ? {
      [K in keyof T]?: ZodFormattedError<T[K]>
    }
  : T extends any[]
    ? {
        [k: number]: ZodFormattedError<T[number]>
      }
    : T extends object
      ? {
          [K in keyof T]?: ZodFormattedError<T[K]>
        }
      : unknown

export type ZodFormattedError<T, U = string> = {
  _errors: U[]
} & _RecursiveZodFormattedError<NonNullable<T>>

export interface IZodError<T = any> extends Error {
  readonly __type__: 'ZuiError'
  issues: ZodIssue[]
  errors: ZodIssue[]
  format(): ZodFormattedError<T>
  format<U>(mapper: (issue: ZodIssue) => U): ZodFormattedError<T, U>
  toString(): string
  message: string
  isEmpty: boolean
  addIssue: (sub: ZodIssue) => void
  addIssues: (subs?: ZodIssue[]) => void
}

type _StripPath<T extends object> = T extends any ? Omit<T, 'path'> : never
export type IssueData = _StripPath<_ZodIssueOptionalMessage> & {
  path?: (string | number)[]
  fatal?: boolean
}

type _ErrorMapCtx = {
  defaultError: string
  data: any
}

export type ZodErrorMap = (
  issue: _ZodIssueOptionalMessage,
  _ctx: _ErrorMapCtx
) => {
  message: string
}

//* ─────────────────────────── Parsing ──────────────────────────────────────

export type ZodParsedType =
  | 'string'
  | 'nan'
  | 'number'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'bigint'
  | 'symbol'
  | 'function'
  | 'undefined'
  | 'null'
  | 'array'
  | 'object'
  | 'unknown'
  | 'promise'
  | 'void'
  | 'never'
  | 'map'
  | 'set'

export type SafeParseSuccess<Output> = {
  success: true
  data: Output
  error?: never
}

export type SafeParseError<Input> = {
  success: false
  error: IZodError<Input>
  data?: never
}

export type SafeParseReturnType<Input, Output> = SafeParseSuccess<Output> | SafeParseError<Input>

type _ParseParams = {
  path: (string | number)[]
  errorMap: ZodErrorMap
  async: boolean
}

export type RefinementCtx = {
  addIssue: (arg: IssueData) => void
  path: (string | number)[]
}

//* ─────────────────────────── Base Type ───────────────────────────────────

export type RawCreateParams =
  | {
      errorMap?: ZodErrorMap
      invalid_type_error?: string
      required_error?: string
      description?: string
      ['x-zui']?: ZuiExtensionObject
    }
  | undefined

export type TypeOf<T extends IZodType> = T['_output']
export type { TypeOf as infer }
export type input<T extends IZodType> = T['_input']
export type output<T extends IZodType> = T['_output']

export type DeepPartialBoolean<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartialBoolean<T[K]> | boolean : boolean
}

export type ZodTypeDef = {
  typeName: string
  errorMap?: ZodErrorMap
  description?: string
  ['x-zui']?: ZuiExtensionObject
}

/**
 * @deprecated - use ZodType instead
 */
export type ZodTypeAny = IZodType<any, any, any>

/**
 * @deprecated use ZodType instead
 */
export type ZodSchema<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> = IZodType<Output, Def, Input>
/**
 * @deprecated use ZodType instead
 */
export type Schema<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> = IZodType<Output, Def, Input>

export interface IZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
  readonly __type__: 'ZuiType'
  _type: Output
  _output: Output
  _input: Input
  _def: Def
  description: string | undefined
  typeName: Def['typeName']
  /** deeply replace all references in the schema */
  dereference(_defs: Record<string, IZodType>): IZodType
  /** deeply scans the schema to check if it contains references */
  getReferences(): string[]
  clone(): IZodType<Output, Def, Input>
  parse(data: unknown, params?: Partial<_ParseParams>): Output
  safeParse(data: unknown, params?: Partial<_ParseParams>): SafeParseReturnType<Input, Output>
  parseAsync(data: unknown, params?: Partial<_ParseParams>): Promise<Output>
  safeParseAsync(data: unknown, params?: Partial<_ParseParams>): Promise<SafeParseReturnType<Input, Output>>
  /** Alias of safeParseAsync */
  spa: (data: unknown, params?: Partial<_ParseParams>) => Promise<SafeParseReturnType<Input, Output>>
  refine<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): IZodEffects<this, RefinedOutput, Input>
  refine(
    check: (arg: Output) => unknown | Promise<unknown>,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): IZodEffects<this, Output, Input>
  refinement<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData)
  ): IZodEffects<this, RefinedOutput, Input>
  refinement(
    check: (arg: Output) => boolean,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData)
  ): IZodEffects<this, Output, Input>
  superRefine<RefinedOutput extends Output>(
    refinement: (arg: Output, ctx: RefinementCtx) => arg is RefinedOutput
  ): IZodEffects<this, RefinedOutput, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => void): IZodEffects<this, Output, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => Promise<void>): IZodEffects<this, Output, Input>
  optional(): IZodOptional<this>
  nullable(): IZodNullable<this>
  nullish(): IZodOptional<IZodNullable<this>>
  array(): IZodArray<this>
  promise(): IZodPromise<this>
  /**
   * # \#\#\# Experimental \#\#\#
   *
   * @experimental This function is experimental and is subject to breaking changes in the future.
   *
   * Would have been named `required` but a method with that name already exists in ZodObject.
   * Makes the schema required; i.e. not optional or undefined. If the schema is already required than it returns itself.
   * Null is not considered optional and remains unchanged.
   *
   * @example z.string().optional().mandatory() // z.string()
   * @example z.string().nullable().mandatory() // z.string().nullable()
   * @example z.string().or(z.undefined()).mandatory() // z.string()
   * @example z.union([z.string(), z.number(), z.undefined()]).mandatory() // z.union([z.string(), z.number()])
   */
  mandatory(): IZodType
  or<T extends IZodType>(option: T): IZodUnion<[this, T]>
  and<T extends IZodType>(incoming: T): IZodIntersection<this, T>
  transform<NewOut>(transform: (arg: Output, ctx: RefinementCtx) => NewOut | Promise<NewOut>): IZodEffects<this, NewOut>
  default(def: NoUndefined<Input>): IZodDefault<this>
  default(def: () => NoUndefined<Input>): IZodDefault<this>
  brand<B extends string | number | symbol>(brand?: B): IZodBranded<this, B>
  catch(def: Output | CatchFn<Output>): IZodCatch<this>
  describe(description: string): this
  pipe<T extends IZodType>(target: T): IZodPipeline<this, T>
  readonly(): IZodReadonly<this>
  isOptional(): boolean
  isNullable(): boolean
  /** append metadata to the schema */
  metadata(data: Record<string, ZuiMetadata>): this
  /** metadataf the schema */
  getMetadata(): Record<string, ZuiMetadata>
  /** set metadata of the schema */
  setMetadata(data: Record<string, ZuiMetadata>): void
  /**
   * metadataf the schema
   * @deprecated use `getMetadata()` instead
   */
  ui: Record<string, ZuiMetadata>
  /**
   * The type of component to use to display the field and its options
   */
  // displayAs<
  //   UI extends UIComponentDefinitions = UIComponentDefinitions,
  //   Type extends _BaseType = _ZodKindToBaseType<this['_def']>,
  // >(
  //   options: ValueOf<UI[Type]>
  // ): this
  /**
   * The title of the field. Defaults to the field name.
   */
  title(title: string): this
  /**
   * Whether the field is hidden in the UI. Useful for internal fields.
   * @default false
   */
  hidden<T = this['_output']>(value?: boolean | ((shape: T | null) => DeepPartialBoolean<T> | boolean)): this
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled<T = this['_output']>(value?: boolean | ((shape: T | null) => DeepPartialBoolean<T> | boolean)): this
  /**
   * Placeholder text for the field
   */
  placeholder(placeholder: string): this
  /**
   * Some Schemas aren't meant to contain metadata, like ZodDefault.
   * In a zui construction like `z.string().default('hello').title('Hello')`, the user's intention is usually to set a title on the string, not on the default value.
   * Also, in JSON-Schema, default is not a data-type like it is in Zui, but an annotation added on the schema itself. Therefore, only one metadata can apply to both the schema and the default value.
   * This property is used to theoot schema that should contain the metadata.
   *
   * TLDR: Allows removing all wrappers around the schema
   * @returns either this or the closest children schema that represents the actual data
   */
  naked(): IZodType

  /** checks if a schema is equal to another */
  isEqual(schema: IZodType): boolean

  /**
   * The type of component to use to display the field and its options
   */
  displayAs<
    UI extends UIComponentDefinitions = UIComponentDefinitions,
    Type extends BaseDisplayAsType = ZodKindToBaseType<this['_def']>,
  >(
    options: DisplayAsOptions<UI[Type][keyof UI[Type]]>
  ): this

  /**
   *
   * @returns a JSON Schema equivalent to the Zui schema
   */
  toJSONSchema(): transforms.ZuiJSONSchema

  /**
   *
   * @param options generation options
   * @returns a string of the TypeScript type representing the schema
   */
  toTypescriptType(opts?: transforms.TypescriptGenerationOptions): string

  /**
   *
   * @param options generation options
   * @returns a typescript program (a string) that would construct the given schema if executed
   */
  toTypescriptSchema(): string
}

//* ─────────────────────────── ZodAny ───────────────────────────────────────

export type ZodAnyDef = {
  typeName: 'ZodAny'
} & ZodTypeDef

export interface IZodAny extends IZodType<any, ZodAnyDef> {}

//* ─────────────────────────── ZodArray ─────────────────────────────────────

export type ZodArrayDef<T extends IZodType = IZodType> = {
  type: T
  typeName: 'ZodArray'
  exactLength: {
    value: number
    message?: string
  } | null
  minLength: {
    value: number
    message?: string
  } | null
  maxLength: {
    value: number
    message?: string
  } | null
} & ZodTypeDef

export type ArrayCardinality = 'many' | 'atleastone'
export type ArrayOutputType<
  T extends IZodType,
  Cardinality extends ArrayCardinality = 'many',
> = Cardinality extends 'atleastone' ? [T['_output'], ...T['_output'][]] : T['_output'][]

export interface IZodArray<T extends IZodType = IZodType, Cardinality extends ArrayCardinality = 'many'>
  extends IZodType<
    ArrayOutputType<T, Cardinality>,
    ZodArrayDef<T>,
    Cardinality extends 'atleastone' ? [T['_input'], ...T['_input'][]] : T['_input'][]
  > {
  element: T
  min(minLength: number, message?: ErrMessage): this
  max(maxLength: number, message?: ErrMessage): this
  length(len: number, message?: ErrMessage): this
  nonempty(message?: ErrMessage): IZodArray<T, 'atleastone'>
}

//* ─────────────────────────── ZodBigInt ────────────────────────────────────

export type ZodBigIntCheck =
  | {
      kind: 'min'
      value: bigint
      inclusive: boolean
      message?: string
    }
  | {
      kind: 'max'
      value: bigint
      inclusive: boolean
      message?: string
    }
  | {
      kind: 'multipleOf'
      value: bigint
      message?: string
    }

export type ZodBigIntDef = {
  checks: ZodBigIntCheck[]
  typeName: 'ZodBigInt'
  coerce: boolean
} & ZodTypeDef

export interface IZodBigInt extends IZodType<bigint, ZodBigIntDef> {
  gte(value: bigint, message?: ErrMessage): IZodBigInt
  min: (value: bigint, message?: ErrMessage) => IZodBigInt
  gt(value: bigint, message?: ErrMessage): IZodBigInt
  lte(value: bigint, message?: ErrMessage): IZodBigInt
  max: (value: bigint, message?: ErrMessage) => IZodBigInt
  lt(value: bigint, message?: ErrMessage): IZodBigInt
  positive(message?: ErrMessage): IZodBigInt
  negative(message?: ErrMessage): IZodBigInt
  nonpositive(message?: ErrMessage): IZodBigInt
  nonnegative(message?: ErrMessage): IZodBigInt
  multipleOf(value: bigint, message?: ErrMessage): IZodBigInt
  minValue: bigint | null
  maxValue: bigint | null
}

//* ─────────────────────────── ZodBoolean ───────────────────────────────────

export type ZodBooleanDef = {
  typeName: 'ZodBoolean'
  coerce: boolean
} & ZodTypeDef

export interface IZodBoolean extends IZodType<boolean, ZodBooleanDef> {}

//* ─────────────────────────── ZodBranded ───────────────────────────────────

type _Key = string | number | symbol

export type ZodBrandedDef<T extends IZodType = IZodType> = {
  type: T
  typeName: 'ZodBranded'
} & ZodTypeDef

export const BRAND: unique symbol = Symbol('zod_brand')
export type BRAND<T extends _Key = _Key> = {
  [BRAND]: {
    [k in T]: true
  }
}

export interface IZodBranded<T extends IZodType = IZodType, B extends _Key = _Key>
  extends IZodType<T['_output'] & BRAND<B>, ZodBrandedDef<T>, T['_input']> {
  unwrap(): T
}

//* ─────────────────────────── ZodCatch ────────────────────────────────────

export type CatchFn<Y> = (ctx: { error: IZodError; input: unknown }) => Y
export type ZodCatchDef<T extends IZodType = IZodType> = {
  innerType: T
  catchValue: CatchFn<T['_output']>
  typeName: 'ZodCatch'
} & ZodTypeDef

export interface IZodCatch<T extends IZodType = IZodType> extends IZodType<T['_output'], ZodCatchDef<T>, unknown> {
  removeCatch(): T
}

//* ─────────────────────────── ZodDate ─────────────────────────────────────

export type ZodDateCheck =
  | {
      kind: 'min'
      value: number
      message?: string
    }
  | {
      kind: 'max'
      value: number
      message?: string
    }

export type ZodDateDef = {
  checks: ZodDateCheck[]
  coerce: boolean
  typeName: 'ZodDate'
} & ZodTypeDef

export interface IZodDate extends IZodType<Date, ZodDateDef> {
  min(minDate: Date, message?: ErrMessage): IZodDate
  max(maxDate: Date, message?: ErrMessage): IZodDate
  minDate: Date | null
  maxDate: Date | null
}

//* ─────────────────────────── ZodDefault ───────────────────────────────────

export type ZodDefaultDef<T extends IZodType = IZodType> = {
  innerType: T
  defaultValue: () => NoUndefined<T['_input']>
  typeName: 'ZodDefault'
} & ZodTypeDef

export interface IZodDefault<T extends IZodType = IZodType>
  extends IZodType<NoUndefined<T['_output']>, ZodDefaultDef<T>, T['_input'] | undefined> {
  removeDefault(): T
  unwrap(): T
}

//* ─────────────────────────── ZodEnum ─────────────────────────────────────

export type EnumValues = [string, ...string[]]

export type EnumValuesMap<T extends EnumValues> = {
  [k in T[number]]: k
}

export type ZodEnumDef<T extends EnumValues = EnumValues> = {
  values: T
  typeName: 'ZodEnum'
} & ZodTypeDef

export type FilterEnum<Values, ToExclude> = Values extends []
  ? []
  : Values extends [infer Head, ...infer Rest]
    ? Head extends ToExclude
      ? FilterEnum<Rest, ToExclude>
      : [Head, ...FilterEnum<Rest, ToExclude>]
    : never

export type NeverCast<A, T> = A extends T ? A : never

export interface IZodEnum<T extends [string, ...string[]] = [string, ...string[]]>
  extends IZodType<T[number], ZodEnumDef<T>> {
  options: T
  enum: EnumValuesMap<T>
  Values: EnumValuesMap<T>
  Enum: EnumValuesMap<T>
  extract<ToExtract extends readonly [T[number], ...T[number][]]>(
    values: ToExtract,
    newDef?: RawCreateParams
  ): IZodEnum<Writeable<ToExtract>>
  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef?: RawCreateParams
  ): IZodEnum<NeverCast<Writeable<FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
}

//* ─────────────────────────── ZodNever ────────────────────────────────────

export type ZodNeverDef = {
  typeName: 'ZodNever'
} & ZodTypeDef

export interface IZodNever extends IZodType<never, ZodNeverDef> {}

//* ─────────────────────────── ZodNullable ─────────────────────────────────

export type ZodNullableDef<T extends IZodType = IZodType> = {
  innerType: T
  typeName: 'ZodNullable'
} & ZodTypeDef

export interface IZodNullable<T extends IZodType = IZodType>
  extends IZodType<T['_output'] | null, ZodNullableDef<T>, T['_input'] | null> {
  unwrap(): T
}

//* ─────────────────────────── ZodOptional ────────────────────────────────

export type ZodOptionalDef<T extends IZodType = IZodType> = {
  innerType: T
  typeName: 'ZodOptional'
} & ZodTypeDef

export interface IZodOptional<T extends IZodType = IZodType>
  extends IZodType<T['_output'] | undefined, ZodOptionalDef<T>, T['_input'] | undefined> {
  unwrap(): T
}

//* ─────────────────────────── ZodTuple ────────────────────────────────────

export type ZodTupleItems = [IZodType, ...IZodType[]]

export type AssertArray<T> = T extends any[] ? T : never

export type OutputTypeOfTuple<T extends ZodTupleItems | []> = AssertArray<{
  [k in keyof T]: T[k] extends IZodType<any, any> ? T[k]['_output'] : never
}>

export type OutputTypeOfTupleWithRest<
  T extends ZodTupleItems | [],
  Rest extends IZodType | null = null,
> = Rest extends IZodType ? [...OutputTypeOfTuple<T>, ...Rest['_output'][]] : OutputTypeOfTuple<T>

export type InputTypeOfTuple<T extends ZodTupleItems | []> = AssertArray<{
  [k in keyof T]: T[k] extends IZodType<any, any> ? T[k]['_input'] : never
}>

export type InputTypeOfTupleWithRest<
  T extends ZodTupleItems | [],
  Rest extends IZodType | null = null,
> = Rest extends IZodType ? [...InputTypeOfTuple<T>, ...Rest['_input'][]] : InputTypeOfTuple<T>

export type ZodTupleDef<T extends ZodTupleItems | [] = ZodTupleItems, Rest extends IZodType | null = null> = {
  items: T
  rest: Rest
  typeName: 'ZodTuple'
} & ZodTypeDef

export interface IZodTuple<
  T extends [IZodType, ...IZodType[]] | [] = [IZodType, ...IZodType[]] | [],
  Rest extends IZodType | null = IZodType | null,
> extends IZodType<OutputTypeOfTupleWithRest<T, Rest>, ZodTupleDef<T, Rest>, InputTypeOfTupleWithRest<T, Rest>> {
  items: T
  rest<Rest extends IZodType>(rest: Rest): IZodTuple<T, Rest>
}

//* ─────────────────────────── ZodObject ────────────────────────────────────

export type OptionalKeys<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? k : never
}[keyof T]

export type RequiredKeys<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? never : k
}[keyof T]

export type AddQuestionMarks<
  T extends object,
  R extends keyof T = RequiredKeys<T>,
  O extends keyof T = OptionalKeys<T>,
> = Pick<T, R> &
  Partial<Pick<T, O>> & {
    [k in keyof T]?: unknown
  }

export type ExtendShape<A, B> = Flatten<Omit<A, keyof B> & B>

export type ZodRawShape = {
  [k: string]: IZodType
}

export type UnknownKeysParam = 'passthrough' | 'strict' | 'strip' | IZodType
export type ZodObjectDef<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = {
  typeName: 'ZodObject'
  shape: () => T
  unknownKeys: UnknownKeys
} & ZodTypeDef

export type ObjectOutputType<
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = UnknownKeysOutputType<UnknownKeys> & Flatten<AddQuestionMarks<BaseObjectOutputType<Shape>>>

export type BaseObjectOutputType<Shape extends ZodRawShape> = {
  [k in keyof Shape]: Shape[k]['_output']
}
export type ObjectInputType<
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
> = Flatten<BaseObjectInputType<Shape>> & UnknownKeysInputType<UnknownKeys>

export type BaseObjectInputType<Shape extends ZodRawShape> = AddQuestionMarks<{
  [k in keyof Shape]: Shape[k]['_input']
}>

export type UnknownKeysInputType<T extends UnknownKeysParam> = T extends IZodType
  ? {
      [k: string]: T['_input'] | unknown
    }
  : T extends 'passthrough'
    ? {
        [k: string]: unknown
      }
    : {}

export type UnknownKeysOutputType<T extends UnknownKeysParam> = T extends IZodType
  ? {
      [k: string]: T['_output'] | unknown
    }
  : T extends 'passthrough'
    ? {
        [k: string]: unknown
      }
    : {}

export type AdditionalProperties<T extends UnknownKeysParam> = T extends IZodType
  ? T
  : T extends 'passthrough'
    ? IZodAny
    : T extends 'strict'
      ? IZodNever
      : undefined

export type Deoptional<T extends IZodType> =
  T extends IZodOptional<infer U> ? Deoptional<U> : T extends IZodNullable<infer U> ? IZodNullable<Deoptional<U>> : T

export type KeyOfObject<T extends ZodRawShape> = Cast<UnionToTuple<keyof T>, [string, ...string[]]>

export type DeepPartial<T extends IZodType> = T extends IZodObject
  ? IZodObject<
      {
        [k in keyof T['shape']]: IZodOptional<DeepPartial<T['shape'][k]>>
      },
      T['_def']['unknownKeys']
    >
  : T extends IZodArray<infer Type, infer Card>
    ? IZodArray<DeepPartial<Type>, Card>
    : T extends IZodOptional<infer Type>
      ? IZodOptional<DeepPartial<Type>>
      : T extends IZodNullable<infer Type>
        ? IZodNullable<DeepPartial<Type>>
        : T extends IZodTuple<infer Items>
          ? {
              [k in keyof Items]: Items[k] extends IZodType ? DeepPartial<Items[k]> : never
            } extends infer PI
            ? PI extends ZodTupleItems
              ? IZodTuple<PI, null>
              : never
            : never
          : T

/**
 * @deprecated use ZodObject instead
 */
export type SomeZodObject = IZodObject<ZodRawShape, UnknownKeysParam>

/**
 * @deprecated use ZodObject instead
 */
export type AnyZodObject = IZodObject<any, any>

export interface IZodObject<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
  Output = ObjectOutputType<T, UnknownKeys>,
  Input = ObjectInputType<T, UnknownKeys>,
> extends IZodType<Output, ZodObjectDef<T, UnknownKeys>, Input> {
  shape: T
  strict(message?: ErrMessage): IZodObject<T, 'strict'>
  strip(): IZodObject<T, 'strip'>
  passthrough(): IZodObject<T, 'passthrough'>
  /**
   * @returns The ZodType that is used to validate additional properties or undefined if extra keys are stripped.
   */
  additionalProperties(): AdditionalProperties<UnknownKeys>
  /**
   * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
   * If you want to pass through unknown properties, use `.passthrough()` instead.
   */
  nonstrict: () => IZodObject<T, 'passthrough'>
  extend<Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ): IZodObject<ExtendShape<T, Augmentation>, UnknownKeys>
  /**
   * @deprecated Use `.extend` instead
   *  */
  augment: <Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ) => IZodObject<ExtendShape<T, Augmentation>, UnknownKeys>
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge<Incoming extends IZodObject<any>, Augmentation extends Incoming['shape']>(
    merging: Incoming
  ): IZodObject<ExtendShape<T, Augmentation>, Incoming['_def']['unknownKeys']>
  setKey<Key extends string, Schema extends IZodType>(
    key: Key,
    schema: Schema
  ): IZodObject<
    T & {
      [k in Key]: Schema
    },
    UnknownKeys
  >
  catchall<Index extends IZodType>(index: Index): IZodObject<T, Index>
  pick<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): IZodObject<Pick<T, Extract<keyof T, keyof Mask>>, UnknownKeys>
  omit<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): IZodObject<Omit<T, keyof Mask>, UnknownKeys>
  /**
   * @deprecated
   */
  deepPartial(): DeepPartial<this>
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
    NoNever<{
      [k in keyof T]: k extends keyof Mask ? IZodOptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
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
    NoNever<{
      [k in keyof T]: k extends keyof Mask ? Deoptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  keyof(): IZodEnum<KeyOfObject<T>>
}

//* ─────────────────────────── ZodDiscriminatedUnion ──────────────────────────

export type ZodDiscriminatedUnionOption<Discriminator extends string> = IZodObject<
  {
    [key in Discriminator]: IZodType
  } & ZodRawShape,
  UnknownKeysParam
>

export type ZodDiscriminatedUnionDef<
  Discriminator extends string = string,
  Options extends ZodDiscriminatedUnionOption<string>[] = ZodDiscriminatedUnionOption<string>[],
> = {
  discriminator: Discriminator
  options: Options
  optionsMap: Map<Primitive, ZodDiscriminatedUnionOption<any>>
  typeName: 'ZodDiscriminatedUnion'
} & ZodTypeDef

export interface IZodDiscriminatedUnion<
  Discriminator extends string = string,
  Options extends ZodDiscriminatedUnionOption<Discriminator>[] = ZodDiscriminatedUnionOption<Discriminator>[],
> extends IZodType<output<Options[number]>, ZodDiscriminatedUnionDef<Discriminator, Options>, input<Options[number]>> {
  discriminator: Discriminator
  options: Options
  optionsMap: Map<Primitive, ZodDiscriminatedUnionOption<any>>
}

//* ─────────────────────────── ZodUnknown ───────────────────────────────────

export type ZodUnknownDef = {
  typeName: 'ZodUnknown'
} & ZodTypeDef

export interface IZodUnknown extends IZodType<unknown, ZodUnknownDef> {}

//* ─────────────────────────── ZodFunction ───────────────────────────────────

export type ZodFunctionDef<Args extends IZodTuple<any, any> = IZodTuple, Returns extends IZodType = IZodType> = {
  args: Args
  returns: Returns
  typeName: 'ZodFunction'
} & ZodTypeDef

export type OuterTypeOfFunction<Args extends IZodTuple<any, any>, Returns extends IZodType> =
  Args['_input'] extends Array<any> ? (...args: Args['_input']) => Returns['_output'] : never

export type InnerTypeOfFunction<Args extends IZodTuple<any, any>, Returns extends IZodType> =
  Args['_output'] extends Array<any> ? (...args: Args['_output']) => Returns['_input'] : never

export interface IZodFunction<
  Args extends IZodTuple<any, any> = IZodTuple<any, any>,
  Returns extends IZodType = IZodType,
> extends IZodType<
    OuterTypeOfFunction<Args, Returns>,
    ZodFunctionDef<Args, Returns>,
    InnerTypeOfFunction<Args, Returns>
  > {
  parameters(): Args
  returnType(): Returns
  args<Items extends [IZodType, ...IZodType[]] | []>(
    ...items: Items
  ): IZodFunction<IZodTuple<Items, IZodUnknown>, Returns>
  returns<NewReturnType extends IZodType<any, any>>(returnType: NewReturnType): IZodFunction<Args, NewReturnType>
  implement<F extends InnerTypeOfFunction<Args, Returns>>(
    func: F
  ): ReturnType<F> extends Returns['_output']
    ? (...args: Args['_input']) => ReturnType<F>
    : OuterTypeOfFunction<Args, Returns>
  strictImplement(func: InnerTypeOfFunction<Args, Returns>): InnerTypeOfFunction<Args, Returns>
  validate: <F extends InnerTypeOfFunction<Args, Returns>>(
    func: F
  ) => ReturnType<F> extends Returns['_output']
    ? (...args: Args['_input']) => ReturnType<F>
    : OuterTypeOfFunction<Args, Returns>
}

//* ─────────────────────────── ZodIntersection ──────────────────────────────

export type ZodIntersectionDef<T extends IZodType = IZodType, U extends IZodType = IZodType> = {
  left: T
  right: U
  typeName: 'ZodIntersection'
} & ZodTypeDef

export interface IZodIntersection<T extends IZodType = IZodType, U extends IZodType = IZodType>
  extends IZodType<T['_output'] & U['_output'], ZodIntersectionDef<T, U>, T['_input'] & U['_input']> {}

//* ─────────────────────────── ZodLazy ─────────────────────────────────────

export type ZodLazyDef<T extends IZodType = IZodType> = {
  getter: () => T
  typeName: 'ZodLazy'
} & ZodTypeDef

export interface IZodLazy<T extends IZodType = IZodType> extends IZodType<output<T>, ZodLazyDef<T>, input<T>> {
  schema: T
}

//* ─────────────────────────── ZodLiteral ───────────────────────────────────

export type ZodLiteralDef<T extends Primitive = Primitive> = {
  value: T
  typeName: 'ZodLiteral'
} & ZodTypeDef

export interface IZodLiteral<T extends Primitive = Primitive> extends IZodType<T, ZodLiteralDef<T>> {
  value: T
}

//* ─────────────────────────── ZodMap ───────────────────────────────────────

export type ZodMapDef<Key extends IZodType = IZodType, Value extends IZodType = IZodType> = {
  valueType: Value
  keyType: Key
  typeName: 'ZodMap'
} & ZodTypeDef

export interface IZodMap<Key extends IZodType = IZodType, Value extends IZodType = IZodType>
  extends IZodType<Map<Key['_output'], Value['_output']>, ZodMapDef<Key, Value>, Map<Key['_input'], Value['_input']>> {
  keySchema: Key
  valueSchema: Value
}

//* ─────────────────────────── ZodNaN ───────────────────────────────────────

export type ZodNaNDef = {
  typeName: 'ZodNaN'
} & ZodTypeDef

export interface IZodNaN extends IZodType<number, ZodNaNDef> {}

//* ─────────────────────────── ZodNativeEnum ────────────────────────────────

export type EnumLike = {
  [k: string]: string | number
  [nu: number]: string
}

export type ZodNativeEnumDef<T extends EnumLike = EnumLike> = {
  values: T
  typeName: 'ZodNativeEnum'
} & ZodTypeDef

export interface IZodNativeEnum<T extends EnumLike = EnumLike> extends IZodType<T[keyof T], ZodNativeEnumDef<T>> {
  enum: T
}

//* ─────────────────────────── ZodNull ─────────────────────────────────────

export type ZodNullDef = {
  typeName: 'ZodNull'
} & ZodTypeDef

export interface IZodNull extends IZodType<null, ZodNullDef> {}

//* ─────────────────────────── ZodNumber ────────────────────────────────────

export type ZodNumberCheck =
  | {
      kind: 'min'
      value: number
      inclusive: boolean
      message?: string
    }
  | {
      kind: 'max'
      value: number
      inclusive: boolean
      message?: string
    }
  | {
      kind: 'int'
      message?: string
    }
  | {
      kind: 'multipleOf'
      value: number
      message?: string
    }
  | {
      kind: 'finite'
      message?: string
    }

export type ZodNumberDef = {
  checks: ZodNumberCheck[]
  typeName: 'ZodNumber'
  coerce: boolean
} & ZodTypeDef

export interface IZodNumber extends IZodType<number, ZodNumberDef> {
  gte(value: number, message?: ErrMessage): IZodNumber
  min: (value: number, message?: ErrMessage) => IZodNumber
  gt(value: number, message?: ErrMessage): IZodNumber
  lte(value: number, message?: ErrMessage): IZodNumber
  max: (value: number, message?: ErrMessage) => IZodNumber
  lt(value: number, message?: ErrMessage): IZodNumber
  int(message?: ErrMessage): IZodNumber
  positive(message?: ErrMessage): IZodNumber
  negative(message?: ErrMessage): IZodNumber
  nonpositive(message?: ErrMessage): IZodNumber
  nonnegative(message?: ErrMessage): IZodNumber
  multipleOf(value: number, message?: ErrMessage): IZodNumber
  step: (value: number, message?: ErrMessage) => IZodNumber
  finite(message?: ErrMessage): IZodNumber
  safe(message?: ErrMessage): IZodNumber
  minValue: number | null
  maxValue: number | null
  isInt: boolean
  isFinite: boolean
}

//* ─────────────────────────── ZodPipeline ──────────────────────────────────

export type ZodPipelineDef<A extends IZodType = IZodType, B extends IZodType = IZodType> = {
  in: A
  out: B
  typeName: 'ZodPipeline'
} & ZodTypeDef

export interface IZodPipeline<A extends IZodType = IZodType, B extends IZodType = IZodType>
  extends IZodType<B['_output'], ZodPipelineDef<A, B>, A['_input']> {}

//* ─────────────────────────── ZodPromise ───────────────────────────────────

export type ZodPromiseDef<T extends IZodType = IZodType> = {
  type: T
  typeName: 'ZodPromise'
} & ZodTypeDef

export interface IZodPromise<T extends IZodType = IZodType>
  extends IZodType<Promise<T['_output']>, ZodPromiseDef<T>, Promise<T['_input']>> {
  unwrap(): T
}

//* ─────────────────────────── ZodReadonly ───────────────────────────────────

export type BuiltIn =
  | (((...args: any[]) => any) | (new (...args: any[]) => any))
  | {
      readonly [Symbol.toStringTag]: string
    }
  | Date
  | Error
  | Generator
  | Promise<unknown>
  | RegExp

export type MakeReadonly<T> =
  T extends Map<infer K, infer V>
    ? ReadonlyMap<K, V>
    : T extends Set<infer V>
      ? ReadonlySet<V>
      : T extends [infer Head, ...infer Tail]
        ? readonly [Head, ...Tail]
        : T extends Array<infer V>
          ? ReadonlyArray<V>
          : T extends BuiltIn
            ? T
            : Readonly<T>

export type ZodReadonlyDef<T extends IZodType = IZodType> = {
  innerType: T
  typeName: 'ZodReadonly'
} & ZodTypeDef

export interface IZodReadonly<T extends IZodType = IZodType>
  extends IZodType<MakeReadonly<T['_output']>, ZodReadonlyDef<T>, MakeReadonly<T['_input']>> {
  unwrap(): T
}

//* ─────────────────────────── ZodString ────────────────────────────────────

export type ZodStringCheck =
  | {
      kind: 'min'
      value: number
      message?: string
    }
  | {
      kind: 'max'
      value: number
      message?: string
    }
  | {
      kind: 'length'
      value: number
      message?: string
    }
  | {
      kind: 'email'
      message?: string
    }
  | {
      kind: 'url'
      message?: string
    }
  | {
      kind: 'emoji'
      message?: string
    }
  | {
      kind: 'uuid'
      message?: string
    }
  | {
      kind: 'cuid'
      message?: string
    }
  | {
      kind: 'includes'
      value: string
      position?: number
      message?: string
    }
  | {
      kind: 'cuid2'
      message?: string
    }
  | {
      kind: 'ulid'
      message?: string
    }
  | {
      kind: 'startsWith'
      value: string
      message?: string
    }
  | {
      kind: 'endsWith'
      value: string
      message?: string
    }
  | {
      kind: 'regex'
      regex: RegExp
      message?: string
    }
  | {
      kind: 'trim'
      message?: string
    }
  | {
      kind: 'toLowerCase'
      message?: string
    }
  | {
      kind: 'toUpperCase'
      message?: string
    }
  | {
      kind: 'datetime'
      offset: boolean
      precision: number | null
      message?: string
    }
  | {
      kind: 'ip'
      version?: 'v4' | 'v6'
      message?: string
    }

export type ZodStringDef = {
  checks: ZodStringCheck[]
  typeName: 'ZodString'
  coerce: boolean
} & ZodTypeDef

export interface IZodString extends IZodType<string, ZodStringDef> {
  email(message?: ErrMessage): IZodString
  url(message?: ErrMessage): IZodString
  emoji(message?: ErrMessage): IZodString
  uuid(message?: ErrMessage): IZodString
  cuid(message?: ErrMessage): IZodString
  cuid2(message?: ErrMessage): IZodString
  ulid(message?: ErrMessage): IZodString
  ip(
    options?:
      | string
      | {
          version?: 'v4' | 'v6'
          message?: string
        }
  ): IZodString
  datetime(
    options?:
      | string
      | {
          message?: string | undefined
          precision?: number | null
          offset?: boolean
        }
  ): IZodString
  regex(regex: RegExp, message?: ErrMessage): IZodString
  includes(
    value: string,
    options?: {
      message?: string
      position?: number
    }
  ): IZodString
  startsWith(value: string, message?: ErrMessage): IZodString
  endsWith(value: string, message?: ErrMessage): IZodString
  min(minLength: number, message?: ErrMessage): IZodString
  max(maxLength: number, message?: ErrMessage): IZodString
  length(len: number, message?: ErrMessage): IZodString
  /**
   * @deprecated Use z.string().min(1) instead.
   * @see {@link IZodString.min}
   */
  nonempty(message?: ErrMessage): IZodString
  trim(): IZodString
  secret(): this
  toLowerCase(): IZodString
  toUpperCase(): IZodString
  isDatetime: boolean
  isEmail: boolean
  isURL: boolean
  isEmoji: boolean
  isUUID: boolean
  isCUID: boolean
  isCUID2: boolean
  isULID: boolean
  isIP: boolean
  minLength: number | null
  maxLength: number | null
}

//* ─────────────────────────── ZodRecord ────────────────────────────────────

export type ZodRecordDef<Key extends KeySchema = KeySchema, Value extends IZodType = IZodType> = {
  valueType: Value
  keyType: Key
  typeName: 'ZodRecord'
} & ZodTypeDef

export type KeySchema = IZodType<string | number | symbol, any, any>
export type RecordType<K extends string | number | symbol, V> = [string] extends [K]
  ? Record<K, V>
  : [number] extends [K]
    ? Record<K, V>
    : [symbol] extends [K]
      ? Record<K, V>
      : [BRAND<string | number | symbol>] extends [K]
        ? Record<K, V>
        : Partial<Record<K, V>>

export interface IZodRecord<Key extends KeySchema = IZodString, Value extends IZodType = IZodType>
  extends IZodType<
    RecordType<Key['_output'], Value['_output']>,
    ZodRecordDef<Key, Value>,
    RecordType<Key['_input'], Value['_input']>
  > {
  keySchema: Key
  valueSchema: Value
  element: Value
}

//* ─────────────────────────── ZodRef ───────────────────────────────────────

export type ZodRefDef = {
  typeName: 'ZodRef'
  uri: string
} & ZodTypeDef

export interface IZodRef extends IZodType<NonNullable<unknown>, ZodRefDef> {}

//* ─────────────────────────── ZodSet ───────────────────────────────────────

export type ZodSetDef<Value extends IZodType = IZodType> = {
  valueType: Value
  typeName: 'ZodSet'
  minSize: {
    value: number
    message?: string
  } | null
  maxSize: {
    value: number
    message?: string
  } | null
} & ZodTypeDef

export interface IZodSet<Value extends IZodType = IZodType>
  extends IZodType<Set<Value['_output']>, ZodSetDef<Value>, Set<Value['_input']>> {
  min(minSize: number, message?: ErrMessage): this
  max(maxSize: number, message?: ErrMessage): this
  size(size: number, message?: ErrMessage): this
  nonempty(message?: ErrMessage): IZodSet<Value>
}

//* ─────────────────────────── ZodSymbol ────────────────────────────────────

export type ZodSymbolDef = {
  typeName: 'ZodSymbol'
} & ZodTypeDef

export interface IZodSymbol extends IZodType<symbol, ZodSymbolDef> {}

//* ─────────────────────────── ZodEffects ───────────────────────────────────

export type RefinementEffect<T> = {
  type: 'refinement'
  refinement: (arg: T, ctx: RefinementCtx) => any
}

export type TransformEffect<T> = {
  type: 'transform'
  transform: (arg: T, ctx: RefinementCtx) => any
}

export type PreprocessEffect<T> = {
  type: 'preprocess'
  transform: (arg: T, ctx: RefinementCtx) => any
}

export type Effect<T> = RefinementEffect<T> | TransformEffect<T> | PreprocessEffect<T>
export type ZodEffectsDef<T extends IZodType = IZodType> = {
  schema: T
  typeName: 'ZodEffects'
  effect: Effect<any>
} & ZodTypeDef

export interface IZodEffects<T extends IZodType = IZodType, Output = output<T>, Input = input<T>>
  extends IZodType<Output, ZodEffectsDef<T>, Input> {
  innerType(): T
  /**
   * @deprecated use naked() instead
   */
  sourceType(): T
}

//* ─────────────────────────── ZodUndefined ─────────────────────────────────

export type ZodUndefinedDef = {
  typeName: 'ZodUndefined'
} & ZodTypeDef

export interface IZodUndefined extends IZodType<undefined, ZodUndefinedDef> {}

//* ─────────────────────────── ZodUnion ────────────────────────────────────

export type DefaultZodUnionOptions = Readonly<[IZodType, IZodType, ...IZodType[]]>
export type ZodUnionOptions = Readonly<[IZodType, ...IZodType[]]>
export type ZodUnionDef<T extends ZodUnionOptions = DefaultZodUnionOptions> = {
  options: T
  typeName: 'ZodUnion'
} & ZodTypeDef

export interface IZodUnion<T extends ZodUnionOptions = DefaultZodUnionOptions>
  extends IZodType<T[number]['_output'], ZodUnionDef<T>, T[number]['_input']> {
  options: T
}

//* ─────────────────────────── ZodVoid ─────────────────────────────────────

export type ZodVoidDef = {
  typeName: 'ZodVoid'
} & ZodTypeDef

export interface IZodVoid extends IZodType<void, ZodVoidDef> {}

//* ─────────────────────────── BuilderRegistry ──────────────────────────────

type _CustomParams = CustomErrorParams & { fatal?: boolean }

export declare function createCustom<T>(
  check?: (data: unknown) => any,
  params?: string | _CustomParams | ((input: any) => _CustomParams),
  fatal?: boolean
): IZodType<T>
export declare function createInstanceOf<T extends abstract new (...args: any[]) => any>(
  cls: T,
  params?: _CustomParams
): IZodType<InstanceType<T>>
export declare function createAny(params?: RawCreateParams): IZodAny
export declare function createUnknown(params?: RawCreateParams): IZodUnknown
export declare function createNever(params?: RawCreateParams): IZodNever
export declare function createVoid(params?: RawCreateParams): IZodVoid
export declare function createNull(params?: RawCreateParams): IZodNull
export declare function createUndefined(params?: RawCreateParams): IZodUndefined
export declare function createSymbol(params?: RawCreateParams): IZodSymbol
export declare function createNan(params?: RawCreateParams): IZodNaN
export declare function createString(params?: RawCreateParams & { coerce?: true }): IZodString
export declare function createNumber(params?: RawCreateParams & { coerce?: boolean }): IZodNumber
export declare function createBoolean(params?: RawCreateParams & { coerce?: boolean }): IZodBoolean
export declare function createBigInt(params?: RawCreateParams & { coerce?: boolean }): IZodBigInt
export declare function createDate(params?: RawCreateParams & { coerce?: boolean }): IZodDate
export declare function createRef(uri: string): IZodRef
export declare function createLiteral<T extends Primitive>(value: T, params?: RawCreateParams): IZodLiteral<T>

export declare function createEnum<U extends string, T extends Readonly<[U, ...U[]]>>(
  values: T,
  params?: RawCreateParams
): IZodEnum<Writeable<T>>
export declare function createEnum<U extends string, T extends [U, ...U[]]>(
  values: T,
  params?: RawCreateParams
): IZodEnum<T>
export declare function createEnum(
  values: [string, ...string[]],
  params?: RawCreateParams
): IZodEnum<[string, ...string[]]>

export declare function createNativeEnum<T extends EnumLike>(values: T, params?: RawCreateParams): IZodNativeEnum<T>
export declare function createArray<T extends IZodType>(schema: T, params?: RawCreateParams): IZodArray<T>
export declare function createObject<T extends ZodRawShape>(shape: T, params?: RawCreateParams): IZodObject<T, 'strip'>
export declare function createStrictObject<T extends ZodRawShape>(
  shape: T,
  params?: RawCreateParams
): IZodObject<T, 'strict'>
export declare function createLazyObject<T extends ZodRawShape>(
  shape: () => T,
  params?: RawCreateParams
): IZodObject<T, 'strip'>
export declare function createUnion<T extends Readonly<[IZodType, IZodType, ...IZodType[]]>>(
  types: T,
  params?: RawCreateParams
): IZodUnion<T>
export declare function createDiscriminatedUnion<
  Discriminator extends string,
  Types extends [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]],
>(discriminator: Discriminator, options: Types, params?: RawCreateParams): IZodDiscriminatedUnion<Discriminator, Types>
export declare function createIntersection<T extends IZodType, U extends IZodType>(
  left: T,
  right: U,
  params?: RawCreateParams
): IZodIntersection<T, U>

export declare function createTuple<T extends [IZodType, ...IZodType[]] | []>(
  schemas: T,
  params?: RawCreateParams
): IZodTuple<T, null>
export declare function createRecord<Value extends IZodType>(
  valueType: Value,
  params?: RawCreateParams
): IZodRecord<IZodString, Value>
export declare function createRecord<Keys extends KeySchema, Value extends IZodType>(
  keySchema: Keys,
  valueType: Value,
  params?: RawCreateParams
): IZodRecord<Keys, Value>
export declare function createRecord(
  first: KeySchema | IZodType,
  second?: RawCreateParams | IZodType,
  third?: RawCreateParams
): IZodRecord<any, any>
export declare function createMap<Key extends IZodType, Value extends IZodType>(
  keyType: Key,
  valueType: Value,
  params?: RawCreateParams
): IZodMap<Key, Value>
export declare function createSet<Value extends IZodType>(valueType: Value, params?: RawCreateParams): IZodSet<Value>
export declare function createLazy<T extends IZodType>(getter: () => T, params?: RawCreateParams): IZodLazy<T>
export declare function createPromise<T extends IZodType>(schema: T, params?: RawCreateParams): IZodPromise<T>
export declare function createFunction(): IZodFunction<IZodTuple<[], IZodUnknown>, IZodUnknown>
export declare function createFunction<T extends IZodTuple<[IZodType, ...IZodType[]] | [], IZodType | null>>(
  args: T
): IZodFunction<T, IZodUnknown>
export declare function createFunction<T extends IZodTuple<[IZodType, ...IZodType[]] | []>, U extends IZodType>(
  args: T,
  returns: U
): IZodFunction<T, U>
export declare function createFunction<
  T extends IZodTuple<[IZodType, ...IZodType[]] | [], IZodType | null>,
  U extends IZodType,
>(args: T, returns: U, params: RawCreateParams): IZodFunction<T, U>
export declare function createFunction(
  args?: IZodTuple<any, any>,
  returns?: IZodType,
  params?: RawCreateParams
): IZodFunction<any, any>

export declare function createEffects<I extends IZodType, O extends IZodType>(
  schema: I,
  effect: Effect<O['_output']>,
  params?: RawCreateParams
): IZodEffects<I, O['_output']>
export declare function createPreprocess<I extends IZodType>(
  preprocess: (arg: unknown, ctx: RefinementCtx) => unknown,
  schema: I,
  params?: RawCreateParams
): IZodEffects<I, I['_output'], unknown>
export declare function createOptional<T extends IZodType>(type: T, params?: RawCreateParams): IZodOptional<T>
export declare function createNullable<T extends IZodType>(type: T, params?: RawCreateParams): IZodNullable<T>
export declare function createReadonly<T extends IZodType>(type: T, params?: RawCreateParams): IZodReadonly<T>
export declare function createDefault<T extends IZodType>(
  type: T,
  value: T['_input'] | (() => NoUndefined<T['_input']>),
  params?: RawCreateParams
): IZodDefault<T>
export declare function createCatch<T extends IZodType>(
  type: T,
  catcher: T['_output'] | CatchFn<T['_output']>,
  params?: RawCreateParams
): IZodCatch<T>
export declare function createPipeline<A extends IZodType, B extends IZodType>(a: A, b: B): IZodPipeline<A, B>
export declare function createBranded<T extends IZodType>(type: T): IZodBranded<T>

export type ZodBuilders = {
  any: typeof createAny
  array: typeof createArray
  bigint: typeof createBigInt
  boolean: typeof createBoolean
  branded: typeof createBranded
  catch: typeof createCatch
  custom: typeof createCustom
  date: typeof createDate
  default: typeof createDefault
  discriminatedUnion: typeof createDiscriminatedUnion
  effects: typeof createEffects
  enum: typeof createEnum
  function: typeof createFunction
  instanceof: typeof createInstanceOf
  intersection: typeof createIntersection
  lazy: typeof createLazy
  literal: typeof createLiteral
  map: typeof createMap
  nan: typeof createNan
  nativeEnum: typeof createNativeEnum
  never: typeof createNever
  null: typeof createNull
  nullable: typeof createNullable
  number: typeof createNumber
  object: typeof createObject
  optional: typeof createOptional
  pipeline: typeof createPipeline
  preprocess: typeof createPreprocess
  promise: typeof createPromise
  record: typeof createRecord
  ref: typeof createRef
  readonly: typeof createReadonly
  set: typeof createSet
  strictObject: typeof createStrictObject
  string: typeof createString
  symbol: typeof createSymbol
  transformer: typeof createEffects
  tuple: typeof createTuple
  undefined: typeof createUndefined
  union: typeof createUnion
  unknown: typeof createUnknown
  void: typeof createVoid
}
