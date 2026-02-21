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
      params: IZodObject<any>
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

export interface IZodError<T = any> extends Error {
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

export type SyncParseReturnType<T> = _OK<T> | _DIRTY<T> | _INVALID
export type AsyncParseReturnType<T> = Promise<SyncParseReturnType<T>>
export type ParseReturnType<T> = SyncParseReturnType<T> | AsyncParseReturnType<T>

type _SafeParseSuccess<Output> = {
  success: true
  data: Output
  error?: never
}

type _SafeParseError<Input> = {
  success: false
  error: IZodError<Input>
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

export type TypeOf<T extends IZodType> = T['_output']
export type input<T extends IZodType> = T['_input']
export type output<T extends IZodType> = T['_output']

type _DeepPartialBoolean<T> = {
  [K in keyof T]?: T[K] extends object ? _DeepPartialBoolean<T[K]> | boolean : boolean
}

export type DeclarationProps =
  | {
      type: 'variable'
      schema: IZodType
      identifier: string
    }
  | {
      type: 'type'
      schema: IZodType
      identifier: string
      args: string[]
    }
  | {
      type: 'none'
      schema: IZodType
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

export interface IZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
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
  safeParse(data: unknown, params?: Partial<_ParseParams>): _SafeParseReturnType<Input, Output>
  parseAsync(data: unknown, params?: Partial<_ParseParams>): Promise<Output>
  safeParseAsync(data: unknown, params?: Partial<_ParseParams>): Promise<_SafeParseReturnType<Input, Output>>
  /** Alias of safeParseAsync */
  spa: (data: unknown, params?: Partial<_ParseParams>) => Promise<_SafeParseReturnType<Input, Output>>
  refine<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    message?: string | _CustomErrorParams | ((arg: Output) => _CustomErrorParams)
  ): IZodEffects<this, RefinedOutput, Input>
  refine(
    check: (arg: Output) => unknown | Promise<unknown>,
    message?: string | _CustomErrorParams | ((arg: Output) => _CustomErrorParams)
  ): IZodEffects<this, Output, Input>
  refinement<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    refinementData: _IssueData | ((arg: Output, ctx: _RefinementCtx) => _IssueData)
  ): IZodEffects<this, RefinedOutput, Input>
  refinement(
    check: (arg: Output) => boolean,
    refinementData: _IssueData | ((arg: Output, ctx: _RefinementCtx) => _IssueData)
  ): IZodEffects<this, Output, Input>
  _refinement(refinement: _RefinementEffect<Output>['refinement']): IZodEffects<this, Output, Input>
  superRefine<RefinedOutput extends Output>(
    refinement: (arg: Output, ctx: _RefinementCtx) => arg is RefinedOutput
  ): IZodEffects<this, RefinedOutput, Input>
  superRefine(refinement: (arg: Output, ctx: _RefinementCtx) => void): IZodEffects<this, Output, Input>
  superRefine(refinement: (arg: Output, ctx: _RefinementCtx) => Promise<void>): IZodEffects<this, Output, Input>
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
  transform<NewOut>(
    transform: (arg: Output, ctx: _RefinementCtx) => NewOut | Promise<NewOut>
  ): IZodEffects<this, NewOut>
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
  naked(): IZodType
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

type _ArrayCardinality = 'many' | 'atleastone'
type _ArrayOutputType<
  T extends IZodType,
  Cardinality extends _ArrayCardinality = 'many',
> = Cardinality extends 'atleastone' ? [T['_output'], ...T['_output'][]] : T['_output'][]

export interface IZodArray<T extends IZodType = IZodType, Cardinality extends _ArrayCardinality = 'many'>
  extends IZodType<
    _ArrayOutputType<T, Cardinality>,
    ZodArrayDef<T>,
    Cardinality extends 'atleastone' ? [T['_input'], ...T['_input'][]] : T['_input'][]
  > {
  element: T
  min(minLength: number, message?: _ErrMessage): this
  max(maxLength: number, message?: _ErrMessage): this
  length(len: number, message?: _ErrMessage): this
  nonempty(message?: _ErrMessage): IZodArray<T, 'atleastone'>
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
  gte(value: bigint, message?: _ErrMessage): IZodBigInt
  min: (value: bigint, message?: _ErrMessage) => IZodBigInt
  gt(value: bigint, message?: _ErrMessage): IZodBigInt
  lte(value: bigint, message?: _ErrMessage): IZodBigInt
  max: (value: bigint, message?: _ErrMessage) => IZodBigInt
  lt(value: bigint, message?: _ErrMessage): IZodBigInt
  positive(message?: _ErrMessage): IZodBigInt
  negative(message?: _ErrMessage): IZodBigInt
  nonpositive(message?: _ErrMessage): IZodBigInt
  nonnegative(message?: _ErrMessage): IZodBigInt
  multipleOf(value: bigint, message?: _ErrMessage): IZodBigInt
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
  min(minDate: Date, message?: _ErrMessage): IZodDate
  max(maxDate: Date, message?: _ErrMessage): IZodDate
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

type _FilterEnum<Values, ToExclude> = Values extends []
  ? []
  : Values extends [infer Head, ...infer Rest]
    ? Head extends ToExclude
      ? _FilterEnum<Rest, ToExclude>
      : [Head, ..._FilterEnum<Rest, ToExclude>]
    : never

type _NeverCast<A, T> = A extends T ? A : never

export interface IZodEnum<T extends [string, ...string[]] = [string, ...string[]]>
  extends IZodType<T[number], ZodEnumDef<T>> {
  options: T
  enum: EnumValuesMap<T>
  Values: EnumValuesMap<T>
  Enum: EnumValuesMap<T>
  extract<ToExtract extends readonly [T[number], ...T[number][]]>(
    values: ToExtract,
    newDef?: _RawCreateParams
  ): IZodEnum<Writeable<ToExtract>>
  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef?: _RawCreateParams
  ): IZodEnum<_NeverCast<Writeable<_FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
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
  extends IZodType<T['_output'] | null, ZodNullableDef<T>, T['_input'] | null> {}

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

type _ZodTupleItems = [IZodType, ...IZodType[]]

type _AssertArray<T> = T extends any[] ? T : never
type _OutputTypeOfTuple<T extends _ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends IZodType<any, any> ? T[k]['_output'] : never
}>

type _OutputTypeOfTupleWithRest<
  T extends _ZodTupleItems | [],
  Rest extends IZodType | null = null,
> = Rest extends IZodType ? [..._OutputTypeOfTuple<T>, ...Rest['_output'][]] : _OutputTypeOfTuple<T>

type _InputTypeOfTuple<T extends _ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends IZodType<any, any> ? T[k]['_input'] : never
}>

type _InputTypeOfTupleWithRest<
  T extends _ZodTupleItems | [],
  Rest extends IZodType | null = null,
> = Rest extends IZodType ? [..._InputTypeOfTuple<T>, ...Rest['_input'][]] : _InputTypeOfTuple<T>

export type ZodTupleDef<T extends _ZodTupleItems | [] = _ZodTupleItems, Rest extends IZodType | null = null> = {
  items: T
  rest: Rest
  typeName: 'ZodTuple'
} & ZodTypeDef

export interface IZodTuple<
  T extends [IZodType, ...IZodType[]] | [] = [IZodType, ...IZodType[]],
  Rest extends IZodType | null = null,
> extends IZodType<_OutputTypeOfTupleWithRest<T, Rest>, ZodTupleDef<T, Rest>, _InputTypeOfTupleWithRest<T, Rest>> {
  items: T
  rest<Rest extends IZodType>(rest: Rest): IZodTuple<T, Rest>
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

type _UnknownKeysInputType<T extends UnknownKeysParam> = T extends IZodType
  ? {
      [k: string]: T['_input'] | unknown
    }
  : T extends 'passthrough'
    ? {
        [k: string]: unknown
      }
    : {}

type _UnknownKeysOutputType<T extends UnknownKeysParam> = T extends IZodType
  ? {
      [k: string]: T['_output'] | unknown
    }
  : T extends 'passthrough'
    ? {
        [k: string]: unknown
      }
    : {}

type _AdditionalProperties<T extends UnknownKeysParam> = T extends IZodType
  ? T
  : T extends 'passthrough'
    ? IZodAny
    : T extends 'strict'
      ? IZodNever
      : undefined

type _Deoptional<T extends IZodType> =
  T extends IZodOptional<infer U> ? _Deoptional<U> : T extends IZodNullable<infer U> ? IZodNullable<_Deoptional<U>> : T

type _KeyOfObject<T extends ZodRawShape> = Cast<UnionToTuple<keyof T>, [string, ...string[]]>

type _DeepPartial<T extends IZodType> = T extends IZodObject
  ? IZodObject<
      {
        [k in keyof T['shape']]: IZodOptional<_DeepPartial<T['shape'][k]>>
      },
      T['_def']['unknownKeys']
    >
  : T extends IZodArray<infer Type, infer Card>
    ? IZodArray<_DeepPartial<Type>, Card>
    : T extends IZodOptional<infer Type>
      ? IZodOptional<_DeepPartial<Type>>
      : T extends IZodNullable<infer Type>
        ? IZodNullable<_DeepPartial<Type>>
        : T extends IZodTuple<infer Items>
          ? {
              [k in keyof Items]: Items[k] extends IZodType ? _DeepPartial<Items[k]> : never
            } extends infer PI
            ? PI extends _ZodTupleItems
              ? IZodTuple<PI>
              : never
            : never
          : T

export interface IZodObject<
  T extends ZodRawShape = ZodRawShape,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
  Output = _ObjectOutputType<T, UnknownKeys>,
  Input = _ObjectInputType<T, UnknownKeys>,
> extends IZodType<Output, ZodObjectDef<T, UnknownKeys>, Input> {
  shape: T
  strict(message?: _ErrMessage): IZodObject<T, 'strict'>
  strip(): IZodObject<T, 'strip'>
  passthrough(): IZodObject<T, 'passthrough'>
  /**
   * @returns The ZodType that is used to validate additional properties or undefined if extra keys are stripped.
   */
  additionalProperties(): _AdditionalProperties<UnknownKeys>
  /**
   * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
   * If you want to pass through unknown properties, use `.passthrough()` instead.
   */
  nonstrict: () => IZodObject<T, 'passthrough'>
  extend<Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ): IZodObject<_ExtendShape<T, Augmentation>, UnknownKeys>
  /**
   * @deprecated Use `.extend` instead
   *  */
  augment: <Augmentation extends ZodRawShape>(
    augmentation: Augmentation
  ) => IZodObject<_ExtendShape<T, Augmentation>, UnknownKeys>
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge<Incoming extends IZodObject<any>, Augmentation extends Incoming['shape']>(
    merging: Incoming
  ): IZodObject<_ExtendShape<T, Augmentation>, Incoming['_def']['unknownKeys']>
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
  deepPartial(): _DeepPartial<this>
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
  ): IZodObject<
    NoNever<{
      [k in keyof T]: k extends keyof Mask ? _Deoptional<T[k]> : T[k]
    }>,
    UnknownKeys
  >
  keyof(): IZodEnum<_KeyOfObject<T>>
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

type _OuterTypeOfFunction<Args extends IZodTuple<any, any>, Returns extends IZodType> =
  Args['_input'] extends Array<any> ? (...args: Args['_input']) => Returns['_output'] : never

type _InnerTypeOfFunction<Args extends IZodTuple<any, any>, Returns extends IZodType> =
  Args['_output'] extends Array<any> ? (...args: Args['_output']) => Returns['_input'] : never

export interface IZodFunction<Args extends IZodTuple<any, any> = IZodTuple, Returns extends IZodType = IZodType>
  extends IZodType<
    _OuterTypeOfFunction<Args, Returns>,
    ZodFunctionDef<Args, Returns>,
    _InnerTypeOfFunction<Args, Returns>
  > {
  parameters(): Args
  returnType(): Returns
  args<Items extends [IZodType, ...IZodType[]]>(...items: Items): IZodFunction<IZodTuple<Items, IZodUnknown>, Returns>
  returns<NewReturnType extends IZodType<any, any>>(returnType: NewReturnType): IZodFunction<Args, NewReturnType>
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

type _EnumLike = {
  [k: string]: string | number
  [nu: number]: string
}

export type ZodNativeEnumDef<T extends _EnumLike = _EnumLike> = {
  values: T
  typeName: 'ZodNativeEnum'
} & ZodTypeDef

export interface IZodNativeEnum<T extends _EnumLike = _EnumLike> extends IZodType<T[keyof T], ZodNativeEnumDef<T>> {
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
  gte(value: number, message?: _ErrMessage): IZodNumber
  min: (value: number, message?: _ErrMessage) => IZodNumber
  gt(value: number, message?: _ErrMessage): IZodNumber
  lte(value: number, message?: _ErrMessage): IZodNumber
  max: (value: number, message?: _ErrMessage) => IZodNumber
  lt(value: number, message?: _ErrMessage): IZodNumber
  int(message?: _ErrMessage): IZodNumber
  positive(message?: _ErrMessage): IZodNumber
  negative(message?: _ErrMessage): IZodNumber
  nonpositive(message?: _ErrMessage): IZodNumber
  nonnegative(message?: _ErrMessage): IZodNumber
  multipleOf(value: number, message?: _ErrMessage): IZodNumber
  step: (value: number, message?: _ErrMessage) => IZodNumber
  finite(message?: _ErrMessage): IZodNumber
  safe(message?: _ErrMessage): IZodNumber
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

export type ZodReadonlyDef<T extends IZodType = IZodType> = {
  innerType: T
  typeName: 'ZodReadonly'
} & ZodTypeDef

export interface IZodReadonly<T extends IZodType = IZodType>
  extends IZodType<_MakeReadonly<T['_output']>, ZodReadonlyDef<T>, _MakeReadonly<T['_input']>> {
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
  email(message?: _ErrMessage): IZodString
  url(message?: _ErrMessage): IZodString
  emoji(message?: _ErrMessage): IZodString
  uuid(message?: _ErrMessage): IZodString
  cuid(message?: _ErrMessage): IZodString
  cuid2(message?: _ErrMessage): IZodString
  ulid(message?: _ErrMessage): IZodString
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
  regex(regex: RegExp, message?: _ErrMessage): IZodString
  includes(
    value: string,
    options?: {
      message?: string
      position?: number
    }
  ): IZodString
  startsWith(value: string, message?: _ErrMessage): IZodString
  endsWith(value: string, message?: _ErrMessage): IZodString
  min(minLength: number, message?: _ErrMessage): IZodString
  max(maxLength: number, message?: _ErrMessage): IZodString
  length(len: number, message?: _ErrMessage): IZodString
  /**
   * @deprecated Use z.string().min(1) instead.
   * @see {@link IZodString.min}
   */
  nonempty(message?: _ErrMessage): IZodString
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

export type ZodRecordDef<Key extends _KeySchema = IZodString, Value extends IZodType = IZodType> = {
  valueType: Value
  keyType: Key
  typeName: 'ZodRecord'
} & ZodTypeDef

type _KeySchema = IZodType<string | number | symbol, any, any>
type _RecordType<K extends string | number | symbol, V> = [string] extends [K]
  ? Record<K, V>
  : [number] extends [K]
    ? Record<K, V>
    : [symbol] extends [K]
      ? Record<K, V>
      : [BRAND<string | number | symbol>] extends [K]
        ? Record<K, V>
        : Partial<Record<K, V>>

export interface IZodRecord<Key extends _KeySchema = IZodString, Value extends IZodType = IZodType>
  extends IZodType<
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
  min(minSize: number, message?: _ErrMessage): this
  max(maxSize: number, message?: _ErrMessage): this
  size(size: number, message?: _ErrMessage): this
  nonempty(message?: _ErrMessage): IZodSet<Value>
}

//* ─────────────────────────── ZodSymbol ────────────────────────────────────

export type ZodSymbolDef = {
  typeName: 'ZodSymbol'
} & ZodTypeDef

export interface IZodSymbol extends IZodType<symbol, ZodSymbolDef, symbol> {}

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
export type ZodEffectsDef<T extends IZodType = IZodType> = {
  schema: T
  typeName: 'ZodEffects'
  effect: _Effect<any>
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

type _DefaultZodUnionOptions = Readonly<[IZodType, IZodType, ...IZodType[]]>
type _ZodUnionOptions = Readonly<[IZodType, ...IZodType[]]>
type ZodUnionDef<T extends _ZodUnionOptions = _DefaultZodUnionOptions> = {
  options: T
  typeName: 'ZodUnion'
} & ZodTypeDef

export interface IZodUnion<T extends _ZodUnionOptions = _DefaultZodUnionOptions>
  extends IZodType<T[number]['_output'], ZodUnionDef<T>, T[number]['_input']> {
  options: T
}

//* ─────────────────────────── ZodVoid ─────────────────────────────────────

export type ZodVoidDef = {
  typeName: 'ZodVoid'
} & ZodTypeDef

export interface IZodVoid extends IZodType<void, ZodVoidDef> {}
