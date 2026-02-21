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

//* ─────────────────────────── Errors & Issues ───────────────────────────────

type _ErrMessage =
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
  expected: _ZodParsedType
  received: _ZodParsedType
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
  unionErrors: ZodError[]
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
  argumentsError: ZodError
} & _ZodIssueBase

export type ZodInvalidReturnTypeIssue = {
  code: 'invalid_return_type'
  returnTypeError: ZodError
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

type _CustomErrorParams = Partial<SafeOmit<ZodCustomIssue, 'code'>>

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

type _IssueData = SafeOmit<_ZodIssueOptionalMessage, 'path'> & {
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

type _ZodParsedType =
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

type _ParseContext = {
  common: {
    issues: ZodIssue[]
    contextualErrorMap?: ZodErrorMap
    async: boolean
  }
  path: (string | number)[]
  schemaErrorMap?: ZodErrorMap
  parent: _ParseContext | null
  data: any
  parsedType: _ZodParsedType
}

type _ParseInput = {
  data: any
  path: (string | number)[]
  parent: _ParseContext
}

type _INVALID = {
  status: 'aborted'
}

type _DIRTY<T> = {
  status: 'dirty'
  value: T
}

type _OK<T> = {
  status: 'valid'
  value: T
}

type _SyncParseReturnType<T> = _OK<T> | _DIRTY<T> | _INVALID
type _AsyncParseReturnType<T> = Promise<_SyncParseReturnType<T>>
type _ParseReturnType<T> = _SyncParseReturnType<T> | _AsyncParseReturnType<T>

type _SafeParseSuccess<Output> = {
  success: true
  data: Output
  error?: never
}

type _SafeParseError<Input> = {
  success: false
  error: ZodError<Input>
  data?: never
}

type _SafeParseReturnType<Input, Output> = _SafeParseSuccess<Output> | _SafeParseError<Input>

type _ParseParams = {
  path: (string | number)[]
  errorMap: ZodErrorMap
  async: boolean
}

type _RefinementCtx = {
  addIssue: (arg: _IssueData) => void
  path: (string | number)[]
}

//* ─────────────────────────── Base Type ───────────────────────────────────

type _RawCreateParams =
  | {
      errorMap?: ZodErrorMap
      invalid_type_error?: string
      required_error?: string
      description?: string
      ['x-zui']?: ZuiExtensionObject
    }
  | undefined

export type TypeOf<T extends ZodType> = T['_output']
export type input<T extends ZodType> = T['_input']
export type output<T extends ZodType> = T['_output']

type _DeepPartialBoolean<T> = {
  [K in keyof T]?: T[K] extends object ? _DeepPartialBoolean<T[K]> | boolean : boolean
}

export type DeclarationProps =
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

export type TypescriptDeclarationType = DeclarationProps['type']
export type TypescriptGenerationOptions = {
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
  parse(data: unknown, params?: Partial<_ParseParams>): Output
  safeParse(data: unknown, params?: Partial<_ParseParams>): _SafeParseReturnType<Input, Output>
  parseAsync(data: unknown, params?: Partial<_ParseParams>): Promise<Output>
  safeParseAsync(data: unknown, params?: Partial<_ParseParams>): Promise<_SafeParseReturnType<Input, Output>>
  /** Alias of safeParseAsync */
  spa: (data: unknown, params?: Partial<_ParseParams>) => Promise<_SafeParseReturnType<Input, Output>>
  refine<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    message?: string | _CustomErrorParams | ((arg: Output) => _CustomErrorParams)
  ): ZodEffects<this, RefinedOutput, Input>
  refine(
    check: (arg: Output) => unknown | Promise<unknown>,
    message?: string | _CustomErrorParams | ((arg: Output) => _CustomErrorParams)
  ): ZodEffects<this, Output, Input>
  refinement<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    refinementData: _IssueData | ((arg: Output, ctx: _RefinementCtx) => _IssueData)
  ): ZodEffects<this, RefinedOutput, Input>
  refinement(
    check: (arg: Output) => boolean,
    refinementData: _IssueData | ((arg: Output, ctx: _RefinementCtx) => _IssueData)
  ): ZodEffects<this, Output, Input>
  _refinement(refinement: _RefinementEffect<Output>['refinement']): ZodEffects<this, Output, Input>
  superRefine<RefinedOutput extends Output>(
    refinement: (arg: Output, ctx: _RefinementCtx) => arg is RefinedOutput
  ): ZodEffects<this, RefinedOutput, Input>
  superRefine(refinement: (arg: Output, ctx: _RefinementCtx) => void): ZodEffects<this, Output, Input>
  superRefine(refinement: (arg: Output, ctx: _RefinementCtx) => Promise<void>): ZodEffects<this, Output, Input>
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
  transform<NewOut>(transform: (arg: Output, ctx: _RefinementCtx) => NewOut | Promise<NewOut>): ZodEffects<this, NewOut>
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

//* ─────────────────────────── ZodAny ───────────────────────────────────────

export type ZodAnyDef = {
  typeName: 'ZodAny'
} & ZodTypeDef

export interface ZodAny extends ZodType<any, ZodAnyDef> {}

//* ─────────────────────────── ZodArray ─────────────────────────────────────

export type ZodArrayDef<T extends ZodType = ZodType> = {
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
  element: T
  min(minLength: number, message?: _ErrMessage): this
  max(maxLength: number, message?: _ErrMessage): this
  length(len: number, message?: _ErrMessage): this
  nonempty(message?: _ErrMessage): ZodArray<T, 'atleastone'>
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

export interface ZodBigInt extends ZodType<bigint, ZodBigIntDef> {
  gte(value: bigint, message?: _ErrMessage): ZodBigInt
  min: (value: bigint, message?: _ErrMessage) => ZodBigInt
  gt(value: bigint, message?: _ErrMessage): ZodBigInt
  lte(value: bigint, message?: _ErrMessage): ZodBigInt
  max: (value: bigint, message?: _ErrMessage) => ZodBigInt
  lt(value: bigint, message?: _ErrMessage): ZodBigInt
  positive(message?: _ErrMessage): ZodBigInt
  negative(message?: _ErrMessage): ZodBigInt
  nonpositive(message?: _ErrMessage): ZodBigInt
  nonnegative(message?: _ErrMessage): ZodBigInt
  multipleOf(value: bigint, message?: _ErrMessage): ZodBigInt
  minValue: bigint | null
  maxValue: bigint | null
}

//* ─────────────────────────── ZodBoolean ───────────────────────────────────

export type ZodBooleanDef = {
  typeName: 'ZodBoolean'
  coerce: boolean
} & ZodTypeDef

export interface ZodBoolean extends ZodType<boolean, ZodBooleanDef> {}

//* ─────────────────────────── ZodBranded ───────────────────────────────────

type _Key = string | number | symbol

export type ZodBrandedDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodBranded'
} & ZodTypeDef

export const BRAND: unique symbol = Symbol('zod_brand')
export type BRAND<T extends _Key = _Key> = {
  [BRAND]: {
    [k in T]: true
  }
}

export interface ZodBranded<T extends ZodType = ZodType, B extends _Key = _Key>
  extends ZodType<T['_output'] & BRAND<B>, ZodBrandedDef<T>, T['_input']> {
  unwrap(): T
}

//* ─────────────────────────── ZodCatch ────────────────────────────────────

export type CatchFn<Y> = (ctx: { error: ZodError; input: unknown }) => Y
export type ZodCatchDef<T extends ZodType = ZodType> = {
  innerType: T
  catchValue: CatchFn<T['_output']>
  typeName: 'ZodCatch'
} & ZodTypeDef

export interface ZodCatch<T extends ZodType = ZodType> extends ZodType<T['_output'], ZodCatchDef<T>, unknown> {
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

export interface ZodDate extends ZodType<Date, ZodDateDef> {
  min(minDate: Date, message?: _ErrMessage): ZodDate
  max(maxDate: Date, message?: _ErrMessage): ZodDate
  minDate: Date | null
  maxDate: Date | null
}

//* ─────────────────────────── ZodDefault ───────────────────────────────────

export type ZodDefaultDef<T extends ZodType = ZodType> = {
  innerType: T
  defaultValue: () => NoUndefined<T['_input']>
  typeName: 'ZodDefault'
} & ZodTypeDef

export interface ZodDefault<T extends ZodType = ZodType>
  extends ZodType<NoUndefined<T['_output']>, ZodDefaultDef<T>, T['_input'] | undefined> {
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
    newDef?: _RawCreateParams
  ): ZodEnum<Writeable<ToExtract>>
  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef?: _RawCreateParams
  ): ZodEnum<_NeverCast<Writeable<_FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
}

//* ─────────────────────────── ZodNever ────────────────────────────────────

export type ZodNeverDef = {
  typeName: 'ZodNever'
} & ZodTypeDef

export interface ZodNever extends ZodType<never, ZodNeverDef> {}

//* ─────────────────────────── ZodNullable ─────────────────────────────────

export type ZodNullableDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodNullable'
} & ZodTypeDef

export interface ZodNullable<T extends ZodType = ZodType>
  extends ZodType<T['_output'] | null, ZodNullableDef<T>, T['_input'] | null> {}

//* ─────────────────────────── ZodOptional ────────────────────────────────

export type ZodOptionalDef<T extends ZodType = ZodType> = {
  innerType: T
  typeName: 'ZodOptional'
} & ZodTypeDef

export interface ZodOptional<T extends ZodType = ZodType>
  extends ZodType<T['_output'] | undefined, ZodOptionalDef<T>, T['_input'] | undefined> {
  unwrap(): T
}

//* ─────────────────────────── ZodTuple ────────────────────────────────────

type _ZodTupleItems = [ZodType, ...ZodType[]]

type _AssertArray<T> = T extends any[] ? T : never
type _OutputTypeOfTuple<T extends _ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_output'] : never
}>

type _OutputTypeOfTupleWithRest<
  T extends _ZodTupleItems | [],
  Rest extends ZodType | null = null,
> = Rest extends ZodType ? [..._OutputTypeOfTuple<T>, ...Rest['_output'][]] : _OutputTypeOfTuple<T>

type _InputTypeOfTuple<T extends _ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_input'] : never
}>

type _InputTypeOfTupleWithRest<T extends _ZodTupleItems | [], Rest extends ZodType | null = null> = Rest extends ZodType
  ? [..._InputTypeOfTuple<T>, ...Rest['_input'][]]
  : _InputTypeOfTuple<T>

export type ZodTupleDef<T extends _ZodTupleItems | [] = _ZodTupleItems, Rest extends ZodType | null = null> = {
  items: T
  rest: Rest
  typeName: 'ZodTuple'
} & ZodTypeDef

export interface ZodTuple<
  T extends [ZodType, ...ZodType[]] | [] = [ZodType, ...ZodType[]],
  Rest extends ZodType | null = null,
> extends ZodType<_OutputTypeOfTupleWithRest<T, Rest>, ZodTupleDef<T, Rest>, _InputTypeOfTupleWithRest<T, Rest>> {
  items: T
  rest<Rest extends ZodType>(rest: Rest): ZodTuple<T, Rest>
}

//* ─────────────────────────── ZodObject ────────────────────────────────────

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
            ? PI extends _ZodTupleItems
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
  shape: T
  strict(message?: _ErrMessage): ZodObject<T, 'strict'>
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
}

//* ─────────────────────────── ZodDiscriminatedUnion ──────────────────────────

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
  discriminator: Discriminator
  options: Options
  optionsMap: Map<Primitive, ZodDiscriminatedUnionOption<any>>
}

//* ─────────────────────────── ZodUnknown ───────────────────────────────────

export type ZodUnknownDef = {
  typeName: 'ZodUnknown'
} & ZodTypeDef

export interface ZodUnknown extends ZodType<unknown, ZodUnknownDef> {}

//* ─────────────────────────── ZodFunction ───────────────────────────────────

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
}

//* ─────────────────────────── ZodIntersection ──────────────────────────────

export type ZodIntersectionDef<T extends ZodType = ZodType, U extends ZodType = ZodType> = {
  left: T
  right: U
  typeName: 'ZodIntersection'
} & ZodTypeDef

export interface ZodIntersection<T extends ZodType = ZodType, U extends ZodType = ZodType>
  extends ZodType<T['_output'] & U['_output'], ZodIntersectionDef<T, U>, T['_input'] & U['_input']> {}

//* ─────────────────────────── ZodLazy ─────────────────────────────────────

export type ZodLazyDef<T extends ZodType = ZodType> = {
  getter: () => T
  typeName: 'ZodLazy'
} & ZodTypeDef

export interface ZodLazy<T extends ZodType = ZodType> extends ZodType<output<T>, ZodLazyDef<T>, input<T>> {
  schema: T
}

//* ─────────────────────────── ZodLiteral ───────────────────────────────────

export type ZodLiteralDef<T extends Primitive = Primitive> = {
  value: T
  typeName: 'ZodLiteral'
} & ZodTypeDef

export interface ZodLiteral<T extends Primitive = Primitive> extends ZodType<T, ZodLiteralDef<T>> {
  value: T
}

//* ─────────────────────────── ZodMap ───────────────────────────────────────

export type ZodMapDef<Key extends ZodType = ZodType, Value extends ZodType = ZodType> = {
  valueType: Value
  keyType: Key
  typeName: 'ZodMap'
} & ZodTypeDef

export interface ZodMap<Key extends ZodType = ZodType, Value extends ZodType = ZodType>
  extends ZodType<Map<Key['_output'], Value['_output']>, ZodMapDef<Key, Value>, Map<Key['_input'], Value['_input']>> {
  keySchema: Key
  valueSchema: Value
}

//* ─────────────────────────── ZodNaN ───────────────────────────────────────

export type ZodNaNDef = {
  typeName: 'ZodNaN'
} & ZodTypeDef

export interface ZodNaN extends ZodType<number, ZodNaNDef> {}

//* ─────────────────────────── ZodNativeEnum ────────────────────────────────

type _EnumLike = {
  [k: string]: string | number
  [nu: number]: string
}

export type ZodNativeEnumDef<T extends _EnumLike = _EnumLike> = {
  values: T
  typeName: 'ZodNativeEnum'
} & ZodTypeDef

export interface ZodNativeEnum<T extends _EnumLike = _EnumLike> extends ZodType<T[keyof T], ZodNativeEnumDef<T>> {
  enum: T
}

//* ─────────────────────────── ZodNull ─────────────────────────────────────

export type ZodNullDef = {
  typeName: 'ZodNull'
} & ZodTypeDef

export interface ZodNull extends ZodType<null, ZodNullDef> {}

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

export interface ZodNumber extends ZodType<number, ZodNumberDef> {
  gte(value: number, message?: _ErrMessage): ZodNumber
  min: (value: number, message?: _ErrMessage) => ZodNumber
  gt(value: number, message?: _ErrMessage): ZodNumber
  lte(value: number, message?: _ErrMessage): ZodNumber
  max: (value: number, message?: _ErrMessage) => ZodNumber
  lt(value: number, message?: _ErrMessage): ZodNumber
  int(message?: _ErrMessage): ZodNumber
  positive(message?: _ErrMessage): ZodNumber
  negative(message?: _ErrMessage): ZodNumber
  nonpositive(message?: _ErrMessage): ZodNumber
  nonnegative(message?: _ErrMessage): ZodNumber
  multipleOf(value: number, message?: _ErrMessage): ZodNumber
  step: (value: number, message?: _ErrMessage) => ZodNumber
  finite(message?: _ErrMessage): ZodNumber
  safe(message?: _ErrMessage): ZodNumber
  minValue: number | null
  maxValue: number | null
  isInt: boolean
  isFinite: boolean
}

//* ─────────────────────────── ZodPipeline ──────────────────────────────────

export type ZodPipelineDef<A extends ZodType = ZodType, B extends ZodType = ZodType> = {
  in: A
  out: B
  typeName: 'ZodPipeline'
} & ZodTypeDef

export interface ZodPipeline<A extends ZodType = ZodType, B extends ZodType = ZodType>
  extends ZodType<B['_output'], ZodPipelineDef<A, B>, A['_input']> {}

//* ─────────────────────────── ZodPromise ───────────────────────────────────

export type ZodPromiseDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodPromise'
} & ZodTypeDef

export interface ZodPromise<T extends ZodType = ZodType>
  extends ZodType<Promise<T['_output']>, ZodPromiseDef<T>, Promise<T['_input']>> {
  unwrap(): T
}

//* ─────────────────────────── ZodReadonly ───────────────────────────────────

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

export interface ZodString extends ZodType<string, ZodStringDef> {
  email(message?: _ErrMessage): ZodString
  url(message?: _ErrMessage): ZodString
  emoji(message?: _ErrMessage): ZodString
  uuid(message?: _ErrMessage): ZodString
  cuid(message?: _ErrMessage): ZodString
  cuid2(message?: _ErrMessage): ZodString
  ulid(message?: _ErrMessage): ZodString
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
  regex(regex: RegExp, message?: _ErrMessage): ZodString
  includes(
    value: string,
    options?: {
      message?: string
      position?: number
    }
  ): ZodString
  startsWith(value: string, message?: _ErrMessage): ZodString
  endsWith(value: string, message?: _ErrMessage): ZodString
  min(minLength: number, message?: _ErrMessage): ZodString
  max(maxLength: number, message?: _ErrMessage): ZodString
  length(len: number, message?: _ErrMessage): ZodString
  /**
   * @deprecated Use z.string().min(1) instead.
   * @see {@link ZodString.min}
   */
  nonempty(message?: _ErrMessage): ZodString
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
  element: Value
}

//* ─────────────────────────── ZodRef ───────────────────────────────────────

export type ZodRefDef = {
  typeName: 'ZodRef'
  uri: string
} & ZodTypeDef

export interface ZodRef extends ZodType<NonNullable<unknown>, ZodRefDef> {}

//* ─────────────────────────── ZodSet ───────────────────────────────────────

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
  min(minSize: number, message?: _ErrMessage): this
  max(maxSize: number, message?: _ErrMessage): this
  size(size: number, message?: _ErrMessage): this
  nonempty(message?: _ErrMessage): ZodSet<Value>
}

//* ─────────────────────────── ZodSymbol ────────────────────────────────────

export type ZodSymbolDef = {
  typeName: 'ZodSymbol'
} & ZodTypeDef

export interface ZodSymbol extends ZodType<symbol, ZodSymbolDef, symbol> {}

//* ─────────────────────────── ZodEffects ───────────────────────────────────

export type _RefinementEffect<T> = {
  type: 'refinement'
  refinement: (arg: T, ctx: _RefinementCtx) => any
}

export type _TransformEffect<T> = {
  type: 'transform'
  transform: (arg: T, ctx: _RefinementCtx) => any
}

export type _PreprocessEffect<T> = {
  type: 'preprocess'
  transform: (arg: T, ctx: _RefinementCtx) => any
}

export type _Effect<T> = _RefinementEffect<T> | _TransformEffect<T> | _PreprocessEffect<T>
export type ZodEffectsDef<T extends ZodType = ZodType> = {
  schema: T
  typeName: 'ZodEffects'
  effect: _Effect<any>
} & ZodTypeDef

export interface ZodEffects<T extends ZodType = ZodType, Output = output<T>, Input = input<T>>
  extends ZodType<Output, ZodEffectsDef<T>, Input> {
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

export interface ZodUndefined extends ZodType<undefined, ZodUndefinedDef> {}

//* ─────────────────────────── ZodUnion ────────────────────────────────────

type _DefaultZodUnionOptions = Readonly<[ZodType, ZodType, ...ZodType[]]>
type _ZodUnionOptions = Readonly<[ZodType, ...ZodType[]]>
type ZodUnionDef<T extends _ZodUnionOptions = _DefaultZodUnionOptions> = {
  options: T
  typeName: 'ZodUnion'
} & ZodTypeDef

export interface ZodUnion<T extends _ZodUnionOptions = _DefaultZodUnionOptions>
  extends ZodType<T[number]['_output'], ZodUnionDef<T>, T[number]['_input']> {
  options: T
}

//* ─────────────────────────── ZodVoid ─────────────────────────────────────

export type ZodVoidDef = {
  typeName: 'ZodVoid'
} & ZodTypeDef

export interface ZodVoid extends ZodType<void, ZodVoidDef> {}
