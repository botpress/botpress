import type {
  BaseType,
  UIComponentDefinitions,
  ZodKindToBaseType,
  JSONSchema,
  ParseSchema,
  EmptyComponentDefinitions,
  ZuiExtensionObject,
  ZuiMetadata,
} from '../../../ui/types'
import { zuiKey } from '../../../ui/constants'
import {
  AsyncParseReturnType,
  getParsedType,
  isAsync,
  IssueData,
  isValid,
  jsonSchemaToZui,
  zuiToJsonSchema,
  objectToZui,
  ParseContext,
  ParseInput,
  ParseParams,
  ParsePath,
  ParseReturnType,
  ParseStatus,
  processCreateParams,
  RefinementEffect,
  SyncParseReturnType,
  util,
  ZodArray,
  ZodBranded,
  ZodCatch,
  ZodCustomIssue,
  ZodDefault,
  ZodEffects,
  ZodError,
  ZodErrorMap,
  ZodFirstPartyTypeKind,
  ZodIntersection,
  ZodIssueCode,
  ZodNullable,
  ZodOptional,
  ZodPipeline,
  ZodPromise,
  ZodReadonly,
  ZodUnion,
} from '../index'
import { CatchFn } from '../catch'
import type { ZuiSchemaOptions } from '../../../transforms/zui-to-json-schema/zui-extension'
import type { ObjectToZuiOptions } from '../../../transforms/object-to-zui'
import { TypescriptGenerationOptions, toTypescript } from '../../../transforms/zui-to-typescript-type'
import { toTypescriptSchema } from '../../../transforms/zui-to-typescript-schema'

export type RefinementCtx = {
  addIssue: (arg: IssueData) => void
  path: (string | number)[]
}
export type ZodRawShape = { [k: string]: ZodTypeAny }
export type ZodTypeAny = ZodType<any, any, any>
export type TypeOf<T extends ZodType<any, any, any>> = T['_output']
export type input<T extends ZodType<any, any, any>> = T['_input']
export type output<T extends ZodType<any, any, any>> = T['_output']
export type { TypeOf as infer }
export type Maskable<T = any> = boolean | ((shape: T | null) => util.DeepPartialBoolean<T> | boolean)
export type CustomErrorParams = Partial<util.Omit<ZodCustomIssue, 'code'>>
export interface ZodTypeDef {
  typeName: ZodFirstPartyTypeKind
  errorMap?: ZodErrorMap
  description?: string
  [zuiKey]?: ZuiExtensionObject
}

export class ParseInputLazyPath implements ParseInput {
  parent: ParseContext
  data: any
  _path: ParsePath
  _key: string | number | (string | number)[]
  _cachedPath: ParsePath = []
  constructor(parent: ParseContext, value: any, path: ParsePath, key: string | number | (string | number)[]) {
    this.parent = parent
    this.data = value
    this._path = path
    this._key = key
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key)
      } else {
        this._cachedPath.push(...this._path, this._key)
      }
    }

    return this._cachedPath
  }
}
const handleResult = <Input, Output>(
  ctx: ParseContext,
  result: SyncParseReturnType<Output>,
): { success: true; data: Output } | { success: false; error: ZodError<Input> } => {
  if (isValid(result)) {
    return { success: true, data: result.value }
  } else {
    if (!ctx.common.issues.length) {
      throw new Error('Validation failed but no issues detected.')
    }

    return {
      success: false,
      get error() {
        if ((this as any)._error) return (this as any)._error as Error
        const error = new ZodError(ctx.common.issues)
        ;(this as any)._error = error
        return (this as any)._error
      },
    }
  }
}

export type RawCreateParams =
  | {
      errorMap?: ZodErrorMap
      invalid_type_error?: string
      required_error?: string
      description?: string
      [zuiKey]?: any
    }
  | undefined
export type ProcessedCreateParams = {
  errorMap?: ZodErrorMap
  description?: string
  [zuiKey]?: any
}
export type SafeParseSuccess<Output> = {
  success: true
  data: Output
  error?: never
}
export type SafeParseError<Input> = {
  success: false
  error: ZodError<Input>
  data?: never
}

export type SafeParseReturnType<Input, Output> = SafeParseSuccess<Output> | SafeParseError<Input>

export abstract class ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
  readonly _type!: Output
  readonly _output!: Output
  readonly _input!: Input
  readonly _def!: Def

  get description() {
    return this._def.description
  }

  abstract _parse(input: ParseInput): ParseReturnType<Output>

  /** deeply replace all references in the schema */
  dereference(_defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return this
  }

  /** deeply scans the schema to check if it contains references */
  getReferences(): string[] {
    return []
  }

  /** checks if a schema is equal to another */
  abstract isEqual(schema: ZodType): boolean

  _getType(input: ParseInput): string {
    return getParsedType(input.data)
  }

  _getOrReturnCtx(input: ParseInput, ctx?: ParseContext | undefined): ParseContext {
    return (
      ctx || {
        common: input.parent.common,
        data: input.data,

        parsedType: getParsedType(input.data),

        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent,
      }
    )
  }

  _processInputParams(input: ParseInput): {
    status: ParseStatus
    ctx: ParseContext
  } {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,

        parsedType: getParsedType(input.data),

        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent,
      },
    }
  }

  _parseSync(input: ParseInput): SyncParseReturnType<Output> {
    const result = this._parse(input)
    if (isAsync(result)) {
      throw new Error('Synchronous parse encountered promise.')
    }
    return result
  }

  _parseAsync(input: ParseInput): AsyncParseReturnType<Output> {
    const result = this._parse(input)
    return Promise.resolve(result)
  }

  parse(data: unknown, params?: Partial<ParseParams>): Output {
    const result = this.safeParse(data, params)
    if (result.success) return result.data
    throw result.error
  }

  safeParse(data: unknown, params?: Partial<ParseParams>): SafeParseReturnType<Input, Output> {
    const ctx: ParseContext = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap,
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    }
    const result = this._parseSync({ data, path: ctx.path, parent: ctx })

    return handleResult(ctx, result)
  }

  async parseAsync(data: unknown, params?: Partial<ParseParams>): Promise<Output> {
    const result = await this.safeParseAsync(data, params)
    if (result.success) return result.data
    throw result.error
  }

  async safeParseAsync(data: unknown, params?: Partial<ParseParams>): Promise<SafeParseReturnType<Input, Output>> {
    const ctx: ParseContext = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true,
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    }

    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx })
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult))
    return handleResult(ctx, result)
  }

  /** Alias of safeParseAsync */
  spa = this.safeParseAsync

  refine<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams),
  ): ZodEffects<this, RefinedOutput, Input>
  refine(
    check: (arg: Output) => unknown | Promise<unknown>,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams),
  ): ZodEffects<this, Output, Input>
  refine(
    check: (arg: Output) => unknown,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams),
  ): ZodEffects<this, Output, Input> {
    const getIssueProperties = (val: Output) => {
      if (typeof message === 'string' || typeof message === 'undefined') {
        return { message }
      } else if (typeof message === 'function') {
        return message(val)
      } else {
        return message
      }
    }
    return this._refinement((val, ctx) => {
      const result = check(val)
      const setError = () =>
        ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val),
        })
      if (typeof Promise !== 'undefined' && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError()
            return false
          } else {
            return true
          }
        })
      }
      if (!result) {
        setError()
        return false
      } else {
        return true
      }
    })
  }

  refinement<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData),
  ): ZodEffects<this, RefinedOutput, Input>
  refinement(
    check: (arg: Output) => boolean,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData),
  ): ZodEffects<this, Output, Input>
  refinement(
    check: (arg: Output) => unknown,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData),
  ): ZodEffects<this, Output, Input> {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === 'function' ? refinementData(val, ctx) : refinementData)
        return false
      } else {
        return true
      }
    })
  }

  _refinement(refinement: RefinementEffect<Output>['refinement']): ZodEffects<this, Output, Input> {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'refinement', refinement },
    })
  }

  superRefine<RefinedOutput extends Output>(
    refinement: (arg: Output, ctx: RefinementCtx) => arg is RefinedOutput,
  ): ZodEffects<this, RefinedOutput, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => void): ZodEffects<this, Output, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => Promise<void>): ZodEffects<this, Output, Input>
  superRefine(
    refinement: (arg: Output, ctx: RefinementCtx) => unknown | Promise<unknown>,
  ): ZodEffects<this, Output, Input> {
    return this._refinement(refinement)
  }

  constructor(def: Def) {
    this._def = def
    this.parse = this.parse.bind(this)
    this.safeParse = this.safeParse.bind(this)
    this.parseAsync = this.parseAsync.bind(this)
    this.safeParseAsync = this.safeParseAsync.bind(this)
    this.spa = this.spa.bind(this)
    this.refine = this.refine.bind(this)
    this.refinement = this.refinement.bind(this)
    this.superRefine = this.superRefine.bind(this)
    this.optional = this.optional.bind(this)
    this.nullable = this.nullable.bind(this)
    this.nullish = this.nullish.bind(this)
    this.array = this.array.bind(this)
    this.promise = this.promise.bind(this)
    this.or = this.or.bind(this)
    this.and = this.and.bind(this)
    this.transform = this.transform.bind(this)
    this.brand = this.brand.bind(this)
    this.default = this.default.bind(this)
    this.catch = this.catch.bind(this)
    this.describe = this.describe.bind(this)
    this.pipe = this.pipe.bind(this)
    this.readonly = this.readonly.bind(this)
    this.isNullable = this.isNullable.bind(this)
    this.isOptional = this.isOptional.bind(this)
  }

  optional(): ZodOptional<this> {
    return ZodOptional.create(this, this._def)
  }
  nullable(): ZodNullable<this> {
    return ZodNullable.create(this, this._def)
  }
  nullish(): ZodOptional<ZodNullable<this>> {
    return this.nullable().optional()
  }
  array(): ZodArray<this> {
    return ZodArray.create(this, this._def)
  }
  promise(): ZodPromise<this> {
    return ZodPromise.create(this, this._def)
  }

  or<T extends ZodTypeAny>(option: T): ZodUnion<[this, T]> {
    return ZodUnion.create([this, option], this._def)
  }

  and<T extends ZodTypeAny>(incoming: T): ZodIntersection<this, T> {
    return ZodIntersection.create(this, incoming, this._def)
  }

  transform<NewOut>(
    transform: (arg: Output, ctx: RefinementCtx) => NewOut | Promise<NewOut>,
  ): ZodEffects<this, NewOut> {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'transform', transform },
    })
  }

  default(def: util.noUndefined<Input>): ZodDefault<this>
  default(def: () => util.noUndefined<Input>): ZodDefault<this>
  default(def: any) {
    const defaultValueFunc = typeof def === 'function' ? def : () => def

    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
    })
  }

  brand<B extends string | number | symbol>(brand?: B): ZodBranded<this, B>
  brand<B extends string | number | symbol>(): ZodBranded<this, B> {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def),
    })
  }

  catch(def: Output | CatchFn<Output>) {
    const catchValueFunc = typeof def === 'function' ? (def as CatchFn<Output>) : () => def

    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
    })
  }

  describe(description: string): this {
    // should set the description on the _metadataRoot
    const This = (this as any).constructor
    return new This({
      ...this._def,
      description,
    })
  }

  pipe<T extends ZodTypeAny>(target: T): ZodPipeline<this, T> {
    return ZodPipeline.create(this, target)
  }

  readonly(): ZodReadonly<this> {
    return ZodReadonly.create(this)
  }

  isOptional(): boolean {
    return this.safeParse(undefined).success
  }

  isNullable(): boolean {
    return this.safeParse(null).success
  }

  // BOTPRESS EXTENSIONS

  /** append metadata to the schema */
  metadata(data: Record<string, ZuiMetadata>): this {
    const root = this._metadataRoot
    root._def[zuiKey] ??= {}
    for (const [key, value] of Object.entries(data)) {
      root._def[zuiKey] = {
        ...root._def[zuiKey],
        [key]: value,
      }
    }
    return this
  }

  /** get metadata of the schema */
  getMetadata(): Record<string, ZuiMetadata> {
    return { ...this._metadataRoot._def[zuiKey] }
  }

  /** set metadata of the schema */
  setMetadata(data: Record<string, ZuiMetadata>): void {
    this._metadataRoot._def[zuiKey] = { ...data }
  }

  /**
   * get metadata of the schema
   * @deprecated use `getMetadata()` instead
   */
  get ui(): Record<string, ZuiMetadata> {
    return { ...this._metadataRoot._def[zuiKey] }
  }

  /**
   * Some Schemas aren't meant to contain metadata, like ZodDefault.
   * In a zui construction like `z.string().default('hello').title('Hello')`, the user's intention is usually to set a title on the string, not on the default value.
   * Also, in JSON-Schema, default is not a data-type like it is in Zui, but an annotation added on the schema itself. Therefore, only one metadata can apply to both the schema and the default value.
   * This property is used to get the root schema that should contain the metadata.
   */
  get _metadataRoot(): ZodType {
    return this.naked()
  }

  /**
   * The type of component to use to display the field and its options
   */
  displayAs<
    UI extends UIComponentDefinitions = EmptyComponentDefinitions,
    Type extends BaseType = ZodKindToBaseType<this['_def']>,
  >(options: ParseSchema<UI[Type][keyof UI[Type]]>): this {
    return this.metadata({ displayAs: [options.id, options.params] })
  }

  /**
   * The title of the field. Defaults to the field name.
   */
  title(title: string): this {
    return this.metadata({ title })
  }

  /**
   * Whether the field is hidden in the UI. Useful for internal fields.
   * @default false
   */
  hidden<T extends any = this['_output']>(
    value?: boolean | ((shape: T | null) => util.DeepPartialBoolean<T> | boolean),
  ): this {
    let data: ZuiMetadata
    if (value === undefined) {
      data = true
    } else if (typeof value === 'function') {
      data = value.toString()
    } else {
      data = value
    }
    return this.metadata({ hidden: data })
  }

  /**
   * Whether the field is disabled
   * @default false
   */
  disabled<T extends any = this['_output']>(
    value?: boolean | ((shape: T | null) => util.DeepPartialBoolean<T> | boolean),
  ): this {
    let data: ZuiMetadata
    if (value === undefined) {
      data = true
    } else if (typeof value === 'function') {
      data = value.toString()
    } else {
      data = value
    }
    return this.metadata({ disabled: data })
  }

  /**
   * Placeholder text for the field
   */
  placeholder(placeholder: string): this {
    return this.metadata({ placeholder })
  }

  toJsonSchema(opts?: ZuiSchemaOptions): JSONSchema {
    return zuiToJsonSchema(this, opts)
  }

  /**
   *
   * @param options generation options
   * @returns a string of the TypeScript type representing the schema
   */
  toTypescript(opts?: TypescriptGenerationOptions): string {
    return toTypescript(this, opts)
  }

  /**
   *
   * @param options generation options
   * @returns a typescript program (a string) that would construct the given schema if executed
   */
  toTypescriptSchema(): string {
    return toTypescriptSchema(this)
  }

  async toTypescriptAsync(
    opts?: Omit<TypescriptGenerationOptions, 'formatter'> & {
      formatter?: (typing: string) => Promise<string> | string
    },
  ): Promise<string> {
    let result = toTypescript(this, { ...opts, formatter: undefined })
    if (opts?.formatter) {
      result = await opts.formatter(result)
    }
    return result
  }

  static fromObject(obj: any, opts?: ObjectToZuiOptions) {
    return objectToZui(obj, opts)
  }

  static fromJsonSchema(schema: JSONSchema | any) {
    return jsonSchemaToZui(schema)
  }

  /**
   * Allows removing all wrappers around the schema
   * @returns either this or the closest children schema that represents the actual data
   */
  naked(): ZodTypeAny {
    return this
  }
}
