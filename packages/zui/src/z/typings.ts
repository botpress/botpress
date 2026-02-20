import { JSONSchema7 } from 'json-schema'
import {
  Cast,
  UnionToTuple,
  NoNever,
  Flatten,
  NoUndefined,
  Primitive,
  SafeOmit,
  Writeable,
  ValueOf,
} from './utils/type-utils'

/**
 * ### UI & Metadata
 */

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

type _BaseType = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'discriminatedUnion'
export type UIComponentDefinitions = {
  [T in _BaseType]: {
    [K: string]: {
      id: string
      params: ZodObject<any>
    }
  }
}

type _ZodKindToBaseType<U extends ZodTypeDef> = U extends ZodStringDef
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
                ? _ZodKindToBaseType<U['innerType']['_def']>
                : U extends ZodOptionalDef
                  ? _ZodKindToBaseType<U['innerType']['_def']>
                  : U extends ZodNullableDef
                    ? _ZodKindToBaseType<U['innerType']['_def']>
                    : U extends ZodDiscriminatedUnionDef
                      ? 'discriminatedUnion'
                      : never

/**
 * ### Errors & Issues
 */

type ErrMessage =
  | string
  | {
      message?: string
    }

type ZodIssueBase = {
  path: (string | number)[]
  message?: string
}

type ZodInvalidTypeIssue = {
  code: 'invalid_type'
  expected: ZodParsedType
  received: ZodParsedType
} & ZodIssueBase

type ZodInvalidLiteralIssue = {
  code: 'invalid_literal'
  expected: unknown
  received: unknown
} & ZodIssueBase

type ZodUnrecognizedKeysIssue = {
  code: 'unrecognized_keys'
  keys: string[]
} & ZodIssueBase

type ZodInvalidUnionIssue = {
  code: 'invalid_union'
  unionErrors: ZodError[]
} & ZodIssueBase

type ZodInvalidUnionDiscriminatorIssue = {
  code: 'invalid_union_discriminator'
  options: Primitive[]
} & ZodIssueBase

type ZodInvalidEnumValueIssue = {
  received: string | number
  code: 'invalid_enum_value'
  options: (string | number)[]
} & ZodIssueBase

type ZodInvalidArgumentsIssue = {
  code: 'invalid_arguments'
  argumentsError: ZodError
} & ZodIssueBase

type ZodInvalidReturnTypeIssue = {
  code: 'invalid_return_type'
  returnTypeError: ZodError
} & ZodIssueBase

type ZodInvalidDateIssue = {
  code: 'invalid_date'
} & ZodIssueBase

type StringValidation =
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

type ZodInvalidStringIssue = {
  code: 'invalid_string'
  validation: StringValidation
} & ZodIssueBase

type ZodTooSmallIssue = {
  code: 'too_small'
  minimum: number | bigint
  inclusive: boolean
  exact?: boolean
  type: 'array' | 'string' | 'number' | 'set' | 'date' | 'bigint'
} & ZodIssueBase

type ZodTooBigIssue = {
  code: 'too_big'
  maximum: number | bigint
  inclusive: boolean
  exact?: boolean
  type: 'array' | 'string' | 'number' | 'set' | 'date' | 'bigint'
} & ZodIssueBase

type ZodInvalidIntersectionTypesIssue = {
  code: 'invalid_intersection_types'
} & ZodIssueBase

type ZodNotMultipleOfIssue = {
  code: 'not_multiple_of'
  multipleOf: number | bigint
} & ZodIssueBase

type ZodNotFiniteIssue = {
  code: 'not_finite'
} & ZodIssueBase

type ZodUnresolvedReferenceIssue = {
  code: 'unresolved_reference'
} & ZodIssueBase

type ZodCustomIssue = {
  code: 'custom'
  params?: {
    [k: string]: any
  }
} & ZodIssueBase

type ZodIssueOptionalMessage =
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

export type ZodIssue = ZodIssueOptionalMessage & {
  fatal?: boolean
  message: string
}
type CustomErrorParams = Partial<SafeOmit<ZodCustomIssue, 'code'>>

type RecursiveZodFormattedError<T> = T extends [any, ...any[]]
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

type ZodFormattedError<T, U = string> = {
  _errors: U[]
} & RecursiveZodFormattedError<NonNullable<T>>

export interface ZodError<T = any> extends Error {
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
type _IssueData = _StripPath<ZodIssueOptionalMessage> & {
  path?: (string | number)[]
  fatal?: boolean
}

type _ErrorMapCtx = {
  defaultError: string
  data: any
}

export type ZodErrorMap = (
  issue: ZodIssueOptionalMessage,
  _ctx: _ErrorMapCtx
) => {
  message: string
}

/**
 * ### Parsing
 */

type ZodParsedType =
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

type ParseContext = {
  common: {
    issues: ZodIssue[]
    contextualErrorMap?: ZodErrorMap
    async: boolean
  }
  path: (string | number)[]
  schemaErrorMap?: ZodErrorMap
  parent: ParseContext | null
  data: any
  parsedType: ZodParsedType
}

type ParseInput = {
  data: any
  path: (string | number)[]
  parent: ParseContext
}

type INVALID = {
  status: 'aborted'
}

type DIRTY<T> = {
  status: 'dirty'
  value: T
}

type OK<T> = {
  status: 'valid'
  value: T
}

type SyncParseReturnType<T> = OK<T> | DIRTY<T> | INVALID
type AsyncParseReturnType<T> = Promise<SyncParseReturnType<T>>
type ParseReturnType<T> = SyncParseReturnType<T> | AsyncParseReturnType<T>

type SafeParseSuccess<Output> = {
  success: true
  data: Output
  error?: never
}

type SafeParseError<Input> = {
  success: false
  error: ZodError<Input>
  data?: never
}

type SafeParseReturnType<Input, Output> = SafeParseSuccess<Output> | SafeParseError<Input>

type ParseParams = {
  path: (string | number)[]
  errorMap: ZodErrorMap
  async: boolean
}

type RefinementCtx = {
  addIssue: (arg: _IssueData) => void
  path: (string | number)[]
}

/**
 * Base Type
 */

type RawCreateParams =
  | {
      errorMap?: ZodErrorMap
      invalid_type_error?: string
      required_error?: string
      description?: string
      ['x-zui']?: ZuiExtensionObject
    }
  | undefined

type TypeOf<T extends ZodType> = T['_output']
type input<T extends ZodType> = T['_input']
type output<T extends ZodType> = T['_output']

type _DeepPartialBoolean<T> = {
  [K in keyof T]?: T[K] extends object ? _DeepPartialBoolean<T[K]> | boolean : boolean
}

type DeclarationProps =
  | {
      type: 'variable'
      schema: ZodType
      identifier: string
    }
  | {
      type: 'type'
      schema: ZodType
      identifier: string
      args: string[]
    }
  | {
      type: 'none'
      schema: ZodType
    }

type TypescriptDeclarationType = DeclarationProps['type']
type TypescriptGenerationOptions = {
  formatter?: (typing: string) => string
  declaration?: boolean | TypescriptDeclarationType
  /**
   * Whether to include closing tags in the generated TypeScript declarations when they exceed 5 lines.
   * This improves readability for large type declarations by adding comments like "// end of TypeName".
   */
  includeClosingTags?: boolean
  treatDefaultAsOptional?: boolean
}

export type ZodTypeDef = {
  typeName: string
  errorMap?: ZodErrorMap
  description?: string
  ['x-zui']?: ZuiExtensionObject
}

export interface ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
  _type: Output
  _output: Output
  _input: Input
  _def: Def
  description: string | undefined
  typeName: Def['typeName']
  /** deeply replace all references in the schema */
  dereference(_defs: Record<string, ZodType>): ZodType
  /** deeply scans the schema to check if it contains references */
  getReferences(): string[]
  clone(): ZodType<Output, Def, Input>
  parse(data: unknown, params?: Partial<ParseParams>): Output
  safeParse(data: unknown, params?: Partial<ParseParams>): SafeParseReturnType<Input, Output>
  parseAsync(data: unknown, params?: Partial<ParseParams>): Promise<Output>
  safeParseAsync(data: unknown, params?: Partial<ParseParams>): Promise<SafeParseReturnType<Input, Output>>
  /** Alias of safeParseAsync */
  spa: (data: unknown, params?: Partial<ParseParams>) => Promise<SafeParseReturnType<Input, Output>>
  refine<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): ZodEffects<this, RefinedOutput, Input>
  refine(
    check: (arg: Output) => unknown | Promise<unknown>,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): ZodEffects<this, Output, Input>
  refinement<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    refinementData: _IssueData | ((arg: Output, ctx: RefinementCtx) => _IssueData)
  ): ZodEffects<this, RefinedOutput, Input>
  refinement(
    check: (arg: Output) => boolean,
    refinementData: _IssueData | ((arg: Output, ctx: RefinementCtx) => _IssueData)
  ): ZodEffects<this, Output, Input>
  _refinement(refinement: RefinementEffect<Output>['refinement']): ZodEffects<this, Output, Input>
  superRefine<RefinedOutput extends Output>(
    refinement: (arg: Output, ctx: RefinementCtx) => arg is RefinedOutput
  ): ZodEffects<this, RefinedOutput, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => void): ZodEffects<this, Output, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => Promise<void>): ZodEffects<this, Output, Input>
  optional(): ZodOptional<this>
  nullable(): ZodNullable<this>
  nullish(): ZodOptional<ZodNullable<this>>
  array(): ZodArray<this>
  promise(): ZodPromise<this>
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
  mandatory(): ZodType
  or<T extends ZodType>(option: T): ZodUnion<[this, T]>
  and<T extends ZodType>(incoming: T): ZodIntersection<this, T>
  transform<NewOut>(transform: (arg: Output, ctx: RefinementCtx) => NewOut | Promise<NewOut>): ZodEffects<this, NewOut>
  default(def: NoUndefined<Input>): ZodDefault<this>
  default(def: () => NoUndefined<Input>): ZodDefault<this>
  brand<B extends string | number | symbol>(brand?: B): ZodBranded<this, B>
  catch(def: Output | CatchFn<Output>): ZodCatch<this>
  describe(description: string): this
  pipe<T extends ZodType>(target: T): ZodPipeline<this, T>
  readonly(): ZodReadonly<this>
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
  displayAs<
    UI extends UIComponentDefinitions = UIComponentDefinitions,
    Type extends _BaseType = _ZodKindToBaseType<this['_def']>,
  >(
    options: ValueOf<UI[Type]>
  ): this
  /**
   * The title of the field. Defaults to the field name.
   */
  title(title: string): this
  /**
   * Whether the field is hidden in the UI. Useful for internal fields.
   * @default false
   */
  hidden<T = this['_output']>(value?: boolean | ((shape: T | null) => _DeepPartialBoolean<T> | boolean)): this
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled<T = this['_output']>(value?: boolean | ((shape: T | null) => _DeepPartialBoolean<T> | boolean)): this
  /**
   * Placeholder text for the field
   */
  placeholder(placeholder: string): this
  /**
   *
   * @returns a JSON Schema equivalent to the Zui schema
   */
  toJSONSchema(): JSONSchema7
  /**
   *
   * @param options generation options
   * @returns a string of the TypeScript type representing the schema
   */
  toTypescriptType(opts?: TypescriptGenerationOptions): string
  /**
   *
   * @param options generation options
   * @returns a typescript program (a string) that would construct the given schema if executed
   */
  toTypescriptSchema(): string

  /**
   * Some Schemas aren't meant to contain metadata, like ZodDefault.
   * In a zui construction like `z.string().default('hello').title('Hello')`, the user's intention is usually to set a title on the string, not on the default value.
   * Also, in JSON-Schema, default is not a data-type like it is in Zui, but an annotation added on the schema itself. Therefore, only one metadata can apply to both the schema and the default value.
   * This property is used to theoot schema that should contain the metadata.
   *
   * TLDR: Allows removing all wrappers around the schema
   * @returns either this or the closest children schema that represents the actual data
   */
  naked(): ZodType
}

/**
 * ### ZodAny
 */

export type ZodAnyDef = {
  typeName: 'ZodAny'
} & ZodTypeDef

export interface ZodAny extends ZodType<any, ZodAnyDef> {
  isEqual(schema: ZodType): schema is ZodAny
}

/**
 * ### ZodArray
 */

type ZodArrayDef<T extends ZodType = ZodType> = {
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

type _ArrayCardinality = 'many' | 'atleastone'
type _ArrayOutputType<
  T extends ZodType,
  Cardinality extends _ArrayCardinality = 'many',
> = Cardinality extends 'atleastone' ? [T['_output'], ...T['_output'][]] : T['_output'][]

export interface ZodArray<T extends ZodType = ZodType, Cardinality extends _ArrayCardinality = 'many'>
  extends ZodType<
    _ArrayOutputType<T, Cardinality>,
    ZodArrayDef<T>,
    Cardinality extends 'atleastone' ? [T['_input'], ...T['_input'][]] : T['_input'][]
  > {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodArray<T, Cardinality>
  isEqual(schema: ZodType): boolean
  element: T
  min(minLength: number, message?: ErrMessage): this
  max(maxLength: number, message?: ErrMessage): this
  length(len: number, message?: ErrMessage): this
  nonempty(message?: ErrMessage): ZodArray<T, 'atleastone'>
}

/**
 * ### ZodBigInt
 */

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

export interface ZodBigInt extends ZodType<bigint, ZodBigIntDef> {
  isEqual(schema: ZodType): boolean
  gte(value: bigint, message?: ErrMessage): ZodBigInt
  min: (value: bigint, message?: ErrMessage) => ZodBigInt
  gt(value: bigint, message?: ErrMessage): ZodBigInt
  lte(value: bigint, message?: ErrMessage): ZodBigInt
  max: (value: bigint, message?: ErrMessage) => ZodBigInt
  lt(value: bigint, message?: ErrMessage): ZodBigInt
  positive(message?: ErrMessage): ZodBigInt
  negative(message?: ErrMessage): ZodBigInt
  nonpositive(message?: ErrMessage): ZodBigInt
  nonnegative(message?: ErrMessage): ZodBigInt
  multipleOf(value: bigint, message?: ErrMessage): ZodBigInt
  minValue: bigint | null
  maxValue: bigint | null
}

/**
 * ### ZodBoolean
 */

export type ZodBooleanDef = {
  typeName: 'ZodBoolean'
  coerce: boolean
} & ZodTypeDef

export interface ZodBoolean extends ZodType<boolean, ZodBooleanDef> {
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodBranded
 */

type _Key = string | number | symbol

export type ZodBrandedDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodBranded'
} & ZodTypeDef

declare const BRAND: unique symbol // TODO: adress this
export type BRAND<T extends _Key = _Key> = {
  [BRAND]: {
    [k in T]: true
  }
}

export interface ZodBranded<T extends ZodType = ZodType, B extends _Key = _Key>
  extends ZodType<T['_output'] & BRAND<B>, ZodBrandedDef<T>, T['_input']> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodBranded<T, B>
  unwrap(): T
  isEqual(schema: ZodType): boolean
  naked(): ZodType
  mandatory(): ZodBranded<ZodType, B>
}

/**
 * ### ZodCatch
 */

export type CatchFn<Y> = (ctx: { error: ZodError; input: unknown }) => Y
export type ZodCatchDef<T extends ZodType = ZodType> = {
  innerType: T
  catchValue: CatchFn<T['_output']>
  typeName: 'ZodCatch'
} & ZodTypeDef

export interface ZodCatch<T extends ZodType = ZodType> extends ZodType<T['_output'], ZodCatchDef<T>, unknown> {
  removeCatch(): T
  isEqual(schema: ZodType): boolean
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodCatch<T>
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodCatch<ZodType>
}

/**
 * ### ZodDate
 */

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

export interface ZodDate extends ZodType<Date, ZodDateDef> {
  min(minDate: Date, message?: ErrMessage): ZodDate
  max(maxDate: Date, message?: ErrMessage): ZodDate
  minDate: Date | null
  maxDate: Date | null
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodDefault
 */

export type ZodDefaultDef<T extends ZodType = ZodType> = {
  innerType: T
  defaultValue: () => NoUndefined<T['_input']>
  typeName: 'ZodDefault'
} & ZodTypeDef

export interface ZodDefault<T extends ZodType = ZodType>
  extends ZodType<NoUndefined<T['_output']>, ZodDefaultDef<T>, T['_input'] | undefined> {
  removeDefault(): T
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodDefault<T>
  isEqual(schema: ZodType): boolean
  unwrap(): T
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodDefault<ZodType>
}

/**
 * ### ZodEnum
 */

export type EnumValues = [string, ...string[]]

export type EnumValuesMap<T extends EnumValues> = {
  [k in T[number]]: k
}

export type ZodEnumDef<T extends EnumValues = EnumValues> = {
  values: T
  typeName: 'ZodEnum'
} & ZodTypeDef

type _FilterEnum<Values, ToExclude> = Values extends []
  ? []
  : Values extends [infer Head, ...infer Rest]
    ? Head extends ToExclude
      ? _FilterEnum<Rest, ToExclude>
      : [Head, ..._FilterEnum<Rest, ToExclude>]
    : never

type _NeverCast<A, T> = A extends T ? A : never

export interface ZodEnum<T extends [string, ...string[]] = [string, ...string[]]>
  extends ZodType<T[number], ZodEnumDef<T>> {
  options: T
  enum: EnumValuesMap<T>
  Values: EnumValuesMap<T>
  Enum: EnumValuesMap<T>
  extract<ToExtract extends readonly [T[number], ...T[number][]]>(
    values: ToExtract,
    newDef?: RawCreateParams
  ): ZodEnum<Writeable<ToExtract>>
  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef?: RawCreateParams
  ): ZodEnum<_NeverCast<Writeable<_FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodNever
 */

export type ZodNeverDef = {
  typeName: 'ZodNever'
} & ZodTypeDef

export interface ZodNever extends ZodType<never, ZodNeverDef> {
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodNullable
 */

export type ZodNullableDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodNullable'
} & ZodTypeDef

export interface ZodNullable<T extends ZodType = ZodType>
  extends ZodType<T['_output'] | null, ZodNullableDef<T>, T['_input'] | null> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodNullable<T>
  unwrap(): T
  isEqual(schema: ZodType): boolean
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodNullable<ZodType>
}

/**
 * ### ZodOptional
 */

export type ZodOptionalDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodOptional'
} & ZodTypeDef

export interface ZodOptional<T extends ZodType = ZodType>
  extends ZodType<T['_output'] | undefined, ZodOptionalDef<T>, T['_input'] | undefined> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodOptional<T>
  unwrap(): T
  isEqual(schema: ZodType): boolean
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodType
}

/**
 * ### ZodTuple
 */

type ZodTupleItems = [ZodType, ...ZodType[]]

type _AssertArray<T> = T extends any[] ? T : never
type _OutputTypeOfTuple<T extends ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_output'] : never
}>

type _OutputTypeOfTupleWithRest<T extends ZodTupleItems | [], Rest extends ZodType | null = null> = Rest extends ZodType
  ? [..._OutputTypeOfTuple<T>, ...Rest['_output'][]]
  : _OutputTypeOfTuple<T>

type _InputTypeOfTuple<T extends ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_input'] : never
}>

type _InputTypeOfTupleWithRest<T extends ZodTupleItems | [], Rest extends ZodType | null = null> = Rest extends ZodType
  ? [..._InputTypeOfTuple<T>, ...Rest['_input'][]]
  : _InputTypeOfTuple<T>

export type ZodTupleDef<T extends ZodTupleItems | [] = ZodTupleItems, Rest extends ZodType | null = null> = {
  items: T
  rest: Rest
  typeName: 'ZodTuple'
} & ZodTypeDef

export interface ZodTuple<
  T extends [ZodType, ...ZodType[]] | [] = [ZodType, ...ZodType[]],
  Rest extends ZodType | null = null,
> extends ZodType<_OutputTypeOfTupleWithRest<T, Rest>, ZodTupleDef<T, Rest>, _InputTypeOfTupleWithRest<T, Rest>> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodTuple<T, Rest>
  items: T
  rest<Rest extends ZodType>(rest: Rest): ZodTuple<T, Rest>
}

/**
 * ### ZodObject
 */

type _OptionalKeys<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? k : never
}[keyof T]

type _RequiredKeys<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? never : k
}[keyof T]

type _AddQuestionMarks<
  T extends object,
  R extends keyof T = _RequiredKeys<T>,
  O extends keyof T = _OptionalKeys<T>,
> = Pick<T, R> &
  Partial<Pick<T, O>> & {
    [k in keyof T]?: unknown
  }

type _ExtendShape<A, B> = Flatten<Omit<A, keyof B> & B>

export type ZodRawShape = {
  [k: string]: ZodType
}

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
> = _UnknownKeysOutputType<UnknownKeys> & Flatten<_AddQuestionMarks<_BaseObjectOutputType<Shape>>>

type _BaseObjectOutputType<Shape extends ZodRawShape> = {
  [k in keyof Shape]: Shape[k]['_output']
}
type _ObjectInputType<Shape extends ZodRawShape, UnknownKeys extends UnknownKeysParam = UnknownKeysParam> = Flatten<
  _BaseObjectInputType<Shape>
> &
  _UnknownKeysInputType<UnknownKeys>

type _BaseObjectInputType<Shape extends ZodRawShape> = _AddQuestionMarks<{
  [k in keyof Shape]: Shape[k]['_input']
}>

type _UnknownKeysInputType<T extends UnknownKeysParam> = T extends ZodType
  ? {
      [k: string]: T['_input'] | unknown
    }
  : T extends 'passthrough'
    ? {
        [k: string]: unknown
      }
    : {}

type _UnknownKeysOutputType<T extends UnknownKeysParam> = T extends ZodType
  ? {
      [k: string]: T['_output'] | unknown
    }
  : T extends 'passthrough'
    ? {
        [k: string]: unknown
      }
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

type _KeyOfObject<T extends ZodRawShape> = Cast<UnionToTuple<keyof T>, [string, ...string[]]>

type _DeepPartial<T extends ZodType> = T extends ZodObject
  ? ZodObject<
      {
        [k in keyof T['shape']]: ZodOptional<_DeepPartial<T['shape'][k]>>
      },
      T['_def']['unknownKeys']
    >
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

export interface ZodObject<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
  Output = _ObjectOutputType<T, UnknownKeys>,
  Input = _ObjectInputType<T, UnknownKeys>,
> extends ZodType<Output, ZodObjectDef<T, UnknownKeys>, Input> {
  _getCached(): {
    shape: T
    keys: string[]
  }
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodObject<T, UnknownKeys, Output, Input>
  shape: T
  strict(message?: ErrMessage): ZodObject<T, 'strict'>
  strip(): ZodObject<T, 'strip'>
  passthrough(): ZodObject<T, 'passthrough'>
  /**
   * @returns The ZodType that is used to validate additional properties or undefined if extra keys are stripped.
   */
  additionalProperties(): _AdditionalProperties<UnknownKeys>
  /**
   * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
   * If you want to pass through unknown properties, use `.passthrough()` instead.
   */
  nonstrict: () => ZodObject<T, 'passthrough'>
  extend<Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ): ZodObject<_ExtendShape<T, Augmentation>, UnknownKeys>
  /**
   * @deprecated Use `.extend` instead
   *  */
  augment: <Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ) => ZodObject<_ExtendShape<T, Augmentation>, UnknownKeys>
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge<Incoming extends ZodObject<any>, Augmentation extends Incoming['shape']>(
    merging: Incoming
  ): ZodObject<_ExtendShape<T, Augmentation>, Incoming['_def']['unknownKeys']>
  setKey<Key extends string, Schema extends ZodType>(
    key: Key,
    schema: Schema
  ): ZodObject<
    T & {
      [k in Key]: Schema
    },
    UnknownKeys
  >
  catchall<Index extends ZodType>(index: Index): ZodObject<T, Index>
  pick<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): ZodObject<Pick<T, Extract<keyof T, keyof Mask>>, UnknownKeys>
  omit<
    Mask extends {
      [k in keyof T]?: true
    },
  >(
    mask: Mask
  ): ZodObject<Omit<T, keyof Mask>, UnknownKeys>
  /**
   * @deprecated
   */
  deepPartial(): _DeepPartial<this>
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
    NoNever<{
      [k in keyof T]: k extends keyof Mask ? ZodOptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
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
    NoNever<{
      [k in keyof T]: k extends keyof Mask ? _Deoptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  keyof(): ZodEnum<_KeyOfObject<T>>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodDiscriminatedUnion
 */

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
  optionsMap: Map<Primitive, ZodDiscriminatedUnionOption<any>>
  typeName: 'ZodDiscriminatedUnion'
} & ZodTypeDef

export interface ZodDiscriminatedUnion<
  Discriminator extends string = string,
  Options extends ZodDiscriminatedUnionOption<Discriminator>[] = ZodDiscriminatedUnionOption<Discriminator>[],
> extends ZodType<output<Options[number]>, ZodDiscriminatedUnionDef<Discriminator, Options>, input<Options[number]>> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodDiscriminatedUnion<Discriminator, Options>
  discriminator: Discriminator
  options: Options
  optionsMap: Map<Primitive, ZodDiscriminatedUnionOption<any>>
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodUnknown
 */

export type ZodUnknownDef = {
  typeName: 'ZodUnknown'
} & ZodTypeDef

export interface ZodUnknown extends ZodType<unknown, ZodUnknownDef> {
  _unknown: true
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodFunction
 */

export type ZodFunctionDef<Args extends ZodTuple<any, any> = ZodTuple, Returns extends ZodType = ZodType> = {
  args: Args
  returns: Returns
  typeName: 'ZodFunction'
} & ZodTypeDef

type _OuterTypeOfFunction<Args extends ZodTuple<any, any>, Returns extends ZodType> =
  Args['_input'] extends Array<any> ? (...args: Args['_input']) => Returns['_output'] : never

type _InnerTypeOfFunction<Args extends ZodTuple<any, any>, Returns extends ZodType> =
  Args['_output'] extends Array<any> ? (...args: Args['_output']) => Returns['_input'] : never

export interface ZodFunction<Args extends ZodTuple<any, any> = ZodTuple, Returns extends ZodType = ZodType>
  extends ZodType<
    _OuterTypeOfFunction<Args, Returns>,
    ZodFunctionDef<Args, Returns>,
    _InnerTypeOfFunction<Args, Returns>
  > {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodFunction<Args, Returns>
  parameters(): Args
  returnType(): Returns
  args<Items extends [ZodType, ...ZodType[]]>(...items: Items): ZodFunction<ZodTuple<Items, ZodUnknown>, Returns>
  returns<NewReturnType extends ZodType<any, any>>(returnType: NewReturnType): ZodFunction<Args, NewReturnType>
  implement<F extends _InnerTypeOfFunction<Args, Returns>>(
    func: F
  ): ReturnType<F> extends Returns['_output']
    ? (...args: Args['_input']) => ReturnType<F>
    : _OuterTypeOfFunction<Args, Returns>
  strictImplement(func: _InnerTypeOfFunction<Args, Returns>): _InnerTypeOfFunction<Args, Returns>
  validate: <F extends _InnerTypeOfFunction<Args, Returns>>(
    func: F
  ) => ReturnType<F> extends Returns['_output']
    ? (...args: Args['_input']) => ReturnType<F>
    : _OuterTypeOfFunction<Args, Returns>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodIntersection
 */

export type ZodIntersectionDef<T extends ZodType = ZodType, U extends ZodType = ZodType> = {
  left: T
  right: U
  typeName: 'ZodIntersection'
} & ZodTypeDef

export interface ZodIntersection<T extends ZodType = ZodType, U extends ZodType = ZodType>
  extends ZodType<T['_output'] & U['_output'], ZodIntersectionDef<T, U>, T['_input'] & U['_input']> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodIntersection<T, U>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodLazy
 */

export type ZodLazyDef<T extends ZodType = ZodType> = {
  getter: () => T
  typeName: 'ZodLazy'
} & ZodTypeDef

export interface ZodLazy<T extends ZodType = ZodType> extends ZodType<output<T>, ZodLazyDef<T>, input<T>> {
  schema: T
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodLazy<T>
  isEqual(schema: ZodType): boolean
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodLazy<ZodType>
}

/**
 * ### ZodLiteral
 */

export type ZodLiteralDef<T extends Primitive = Primitive> = {
  value: T
  typeName: 'ZodLiteral'
} & ZodTypeDef

export interface ZodLiteral<T extends Primitive = Primitive> extends ZodType<T, ZodLiteralDef<T>> {
  value: T
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodMap
 */

export type ZodMapDef<Key extends ZodType = ZodType, Value extends ZodType = ZodType> = {
  valueType: Value
  keyType: Key
  typeName: 'ZodMap'
} & ZodTypeDef

export interface ZodMap<Key extends ZodType = ZodType, Value extends ZodType = ZodType>
  extends ZodType<Map<Key['_output'], Value['_output']>, ZodMapDef<Key, Value>, Map<Key['_input'], Value['_input']>> {
  keySchema: Key
  valueSchema: Value
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodMap<Key, Value>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodNaN
 */

export type ZodNaNDef = {
  typeName: 'ZodNaN'
} & ZodTypeDef

export interface ZodNaN extends ZodType<number, ZodNaNDef> {
  _parse(input: ParseInput): ParseReturnType<any>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodNativeEnum
 */

export type ZodNativeEnumDef<T extends EnumLike = EnumLike> = {
  values: T
  typeName: 'ZodNativeEnum'
} & ZodTypeDef
type EnumLike = {
  [k: string]: string | number
  [nu: number]: string
}

export interface ZodNativeEnum<T extends EnumLike = EnumLike> extends ZodType<T[keyof T], ZodNativeEnumDef<T>> {
  enum: T
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodNull
 */

export type ZodNullDef = {
  typeName: 'ZodNull'
} & ZodTypeDef

export interface ZodNull extends ZodType<null, ZodNullDef> {
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodNumber
 */

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

export interface ZodNumber extends ZodType<number, ZodNumberDef> {
  gte(value: number, message?: ErrMessage): ZodNumber
  min: (value: number, message?: ErrMessage) => ZodNumber
  gt(value: number, message?: ErrMessage): ZodNumber
  lte(value: number, message?: ErrMessage): ZodNumber
  max: (value: number, message?: ErrMessage) => ZodNumber
  lt(value: number, message?: ErrMessage): ZodNumber
  int(message?: ErrMessage): ZodNumber
  positive(message?: ErrMessage): ZodNumber
  negative(message?: ErrMessage): ZodNumber
  nonpositive(message?: ErrMessage): ZodNumber
  nonnegative(message?: ErrMessage): ZodNumber
  multipleOf(value: number, message?: ErrMessage): ZodNumber
  step: (value: number, message?: ErrMessage) => ZodNumber
  finite(message?: ErrMessage): ZodNumber
  safe(message?: ErrMessage): ZodNumber
  minValue: number | null
  maxValue: number | null
  isInt: boolean
  isFinite: boolean
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodObject
 */

export type ZodPipelineDef<A extends ZodType = ZodType, B extends ZodType = ZodType> = {
  in: A
  out: B
  typeName: 'ZodPipeline'
} & ZodTypeDef

export interface ZodPipeline<A extends ZodType = ZodType, B extends ZodType = ZodType>
  extends ZodType<B['_output'], ZodPipelineDef<A, B>, A['_input']> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodPipeline<A, B>
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodPromise
 */

export type ZodPromiseDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodPromise'
} & ZodTypeDef

export interface ZodPromise<T extends ZodType = ZodType>
  extends ZodType<Promise<T['_output']>, ZodPromiseDef<T>, Promise<T['_input']>> {
  unwrap(): T
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodPromise<T>
  isEqual(schema: ZodType): boolean
  naked(): ZodType<any, ZodTypeDef, any>
}

/**
 * ### ZodReadonly
 */

type _BuiltIn =
  | (((...args: any[]) => any) | (new (...args: any[]) => any))
  | {
      readonly [Symbol.toStringTag]: string
    }
  | Date
  | Error
  | Generator
  | Promise<unknown>
  | RegExp

type _MakeReadonly<T> =
  T extends Map<infer K, infer V>
    ? ReadonlyMap<K, V>
    : T extends Set<infer V>
      ? ReadonlySet<V>
      : T extends [infer Head, ...infer Tail]
        ? readonly [Head, ...Tail]
        : T extends Array<infer V>
          ? ReadonlyArray<V>
          : T extends _BuiltIn
            ? T
            : Readonly<T>

export type ZodReadonlyDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodReadonly'
} & ZodTypeDef

export interface ZodReadonly<T extends ZodType = ZodType>
  extends ZodType<_MakeReadonly<T['_output']>, ZodReadonlyDef<T>, _MakeReadonly<T['_input']>> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodReadonly<T>
  unwrap(): T
  isEqual(schema: ZodType): boolean
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodReadonly<ZodType>
}

/**
 * ### ZodString
 */

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

export interface ZodString extends ZodType<string, ZodStringDef> {
  email(message?: ErrMessage): ZodString
  url(message?: ErrMessage): ZodString
  emoji(message?: ErrMessage): ZodString
  uuid(message?: ErrMessage): ZodString
  cuid(message?: ErrMessage): ZodString
  cuid2(message?: ErrMessage): ZodString
  ulid(message?: ErrMessage): ZodString
  ip(
    options?:
      | string
      | {
          version?: 'v4' | 'v6'
          message?: string
        }
  ): ZodString
  datetime(
    options?:
      | string
      | {
          message?: string | undefined
          precision?: number | null
          offset?: boolean
        }
  ): ZodString
  regex(regex: RegExp, message?: ErrMessage): ZodString
  includes(
    value: string,
    options?: {
      message?: string
      position?: number
    }
  ): ZodString
  startsWith(value: string, message?: ErrMessage): ZodString
  endsWith(value: string, message?: ErrMessage): ZodString
  min(minLength: number, message?: ErrMessage): ZodString
  max(maxLength: number, message?: ErrMessage): ZodString
  length(len: number, message?: ErrMessage): ZodString
  /**
   * @deprecated Use z.string().min(1) instead.
   * @see {@link ZodString.min}
   */
  nonempty(message?: ErrMessage): ZodString
  trim(): ZodString
  secret(): this
  toLowerCase(): ZodString
  toUpperCase(): ZodString
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
  isEqual(schema: ZodType): boolean
}

export type ZodRecordDef<Key extends _KeySchema = ZodString, Value extends ZodType = ZodType> = {
  valueType: Value
  keyType: Key
  typeName: 'ZodRecord'
} & ZodTypeDef

type _KeySchema = ZodType<string | number | symbol, any, any>
type _RecordType<K extends string | number | symbol, V> = [string] extends [K]
  ? Record<K, V>
  : [number] extends [K]
    ? Record<K, V>
    : [symbol] extends [K]
      ? Record<K, V>
      : [BRAND<string | number | symbol>] extends [K]
        ? Record<K, V>
        : Partial<Record<K, V>>

export interface ZodRecord<Key extends _KeySchema = ZodString, Value extends ZodType = ZodType>
  extends ZodType<
    _RecordType<Key['_output'], Value['_output']>,
    ZodRecordDef<Key, Value>,
    _RecordType<Key['_input'], Value['_input']>
  > {
  keySchema: Key
  valueSchema: Value
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodRecord<Key, Value>
  element: Value
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodRef
 */

export type ZodRefDef = {
  typeName: 'ZodRef'
  uri: string
} & ZodTypeDef

export interface ZodRef extends ZodType<NonNullable<unknown>, ZodRefDef> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  isOptional(): boolean
  isNullable(): boolean
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodSet
 */

export type ZodSetDef<Value extends ZodType = ZodType> = {
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

export interface ZodSet<Value extends ZodType = ZodType>
  extends ZodType<Set<Value['_output']>, ZodSetDef<Value>, Set<Value['_input']>> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodSet<Value>
  min(minSize: number, message?: ErrMessage): this
  max(maxSize: number, message?: ErrMessage): this
  size(size: number, message?: ErrMessage): this
  nonempty(message?: ErrMessage): ZodSet<Value>
  isEqual(schema: ZodType): boolean
}

/**
 * ZodSymbol
 */

export type ZodSymbolDef = {
  typeName: 'ZodSymbol'
} & ZodTypeDef

export interface ZodSymbol extends ZodType<symbol, ZodSymbolDef, symbol> {
  isEqual(schema: ZodType): boolean
}

/**
 * ### ZodEffects
 */

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
export type ZodEffectsDef<T extends ZodType = ZodType> = {
  schema: T
  typeName: 'ZodEffects'
  effect: Effect<any>
} & ZodTypeDef

export interface ZodEffects<T extends ZodType = ZodType, Output = output<T>, Input = input<T>>
  extends ZodType<Output, ZodEffectsDef<T>, Input> {
  innerType(): T
  /**
   * @deprecated use naked() instead
   */
  sourceType(): T
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodEffects<T, Output, Input>
  isEqual(schema: ZodType): boolean
  naked(): ZodType<any, ZodTypeDef, any>
  mandatory(): ZodEffects<ZodType>
}

/**
 * ### ZodUndefined
 */

export type ZodUndefinedDef = {
  typeName: 'ZodUndefined'
} & ZodTypeDef

export interface ZodUndefined extends ZodType<undefined, ZodUndefinedDef> {
  params?: RawCreateParams
  isEqual(schema: ZodType): boolean
  mandatory(): ZodNever
}

/**
 * ### ZodUnion
 */

type _DefaultZodUnionOptions = Readonly<[ZodType, ZodType, ...ZodType[]]>
type ZodUnionOptions = Readonly<[ZodType, ...ZodType[]]>
type ZodUnionDef<T extends ZodUnionOptions = _DefaultZodUnionOptions> = {
  options: T
  typeName: 'ZodUnion'
} & ZodTypeDef

export interface ZodUnion<T extends ZodUnionOptions = _DefaultZodUnionOptions>
  extends ZodType<T[number]['_output'], ZodUnionDef<T>, T[number]['_input']> {
  dereference(defs: Record<string, ZodType>): ZodType
  getReferences(): string[]
  clone(): ZodUnion<T>
  options: T
  isEqual(schema: ZodType): boolean
  mandatory(): ZodType
}

/**
 * ### ZodVoid
 */

export type ZodVoidDef = {
  typeName: 'ZodVoid'
} & ZodTypeDef

export interface ZodVoid extends ZodType<void, ZodVoidDef> {
  isEqual(schema: ZodType): boolean
}
