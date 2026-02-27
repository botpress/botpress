import type * as transforms from '../../../transforms'
import { zuiKey } from '../../consts'
import { ZodError } from '../../error'
import { builders } from '../../internal-builders'
import type {
  BaseDisplayAsType,
  DisplayAsOptions,
  UIComponentDefinitions,
  ZuiMetadata,
  DeepPartialBoolean,
  IZodBaseType,
  ZodBaseTypeDef,
  SafeParseReturnType,
  CatchFn,
  IZodArray,
  IZodBranded,
  IZodCatch,
  IZodDefault,
  IZodIntersection,
  IZodNullable,
  IZodOptional,
  IZodPipeline,
  IZodPromise,
  IZodReadonly,
  IZodEffects,
  IZodUnion,
  RefinementEffect,
  RefinementCtx,
  CustomErrorParams,
  IssueData,
} from '../../typings'
import * as utils from '../../utils'

// TODO(circle): get rid of circular dependency between zui core and transforms

import {
  getParsedType,
  isAsync,
  isValid,
  ParseContext,
  ParseInput,
  ParseParams,
  ParseStatus,
  ParseReturnType,
  AsyncParseReturnType,
  SyncParseReturnType,
} from './parseUtil'

export * from './parseUtil'

class _CircularDependencyError extends Error {
  public constructor(private _propName: keyof IZodBaseType) {
    super(
      `Cannot access property ${_propName} before initialization. You're probably importing ZUI incorrectly. If not, reach out to the maintainers.`
    )
  }
}

export abstract class ZodBaseTypeImpl<Output = any, Def extends ZodBaseTypeDef = ZodBaseTypeDef, Input = Output>
  implements IZodBaseType<Output, Def, Input>
{
  readonly __type__ = 'ZuiType'
  readonly _type!: Output
  readonly _output!: Output
  readonly _input!: Input
  readonly _def!: Def

  get description() {
    return this._metadataRoot._def.description
  }

  get typeName(): Def['typeName'] {
    return this._def.typeName
  }

  abstract _parse(input: ParseInput): ParseReturnType<Output>

  /** deeply replace all references in the schema */
  dereference(_defs: Record<string, IZodBaseType>): IZodBaseType {
    return this
  }

  /** deeply scans the schema to check if it contains references */
  getReferences(): string[] {
    return []
  }

  clone(): IZodBaseType<Output, Def, Input> {
    const This = (this as any).constructor
    return new This({
      ...this._def,
    })
  }

  /** checks if a schema is equal to another */
  abstract isEqual(schema: IZodBaseType): boolean

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

    return this._handleResult(ctx, result)
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
    return this._handleResult(ctx, result)
  }

  /** Alias of safeParseAsync */
  spa = this.safeParseAsync

  refine<RefinedOutput extends Output>(
    check: (arg: Output) => arg is RefinedOutput,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): IZodEffects<this, RefinedOutput, Input>
  refine(
    check: (arg: Output) => unknown | Promise<unknown>,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): IZodEffects<this, Output, Input>
  refine(
    check: (arg: Output) => unknown,
    message?: string | CustomErrorParams | ((arg: Output) => CustomErrorParams)
  ): IZodEffects<this, Output, Input> {
    const getIssueProperties = (val: Output) => {
      if (typeof message === 'string' || typeof message === 'undefined') {
        return { message }
      } else if (typeof message === 'function') {
        return message(val)
      } else {
        return message
      }
    }
    return this._refinement((val: Output, ctx: RefinementCtx) => {
      const result = check(val)
      const setError = () =>
        ctx.addIssue({
          code: 'custom',
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
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData)
  ): IZodEffects<this, RefinedOutput, Input>
  refinement(
    check: (arg: Output) => boolean,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData)
  ): IZodEffects<this, Output, Input>
  refinement(
    check: (arg: Output) => unknown,
    refinementData: IssueData | ((arg: Output, ctx: RefinementCtx) => IssueData)
  ): IZodEffects<this, Output, Input> {
    return this._refinement((val: Output, ctx: RefinementCtx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === 'function' ? refinementData(val, ctx) : refinementData)
        return false
      } else {
        return true
      }
    })
  }

  _refinement(refinement: RefinementEffect<Output>['refinement']): IZodEffects<this, Output, Input> {
    return builders.effects(this, { type: 'refinement', refinement })
  }

  superRefine<RefinedOutput extends Output>(
    refinement: (arg: Output, ctx: RefinementCtx) => arg is RefinedOutput
  ): IZodEffects<this, RefinedOutput, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => void): IZodEffects<this, Output, Input>
  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => Promise<void>): IZodEffects<this, Output, Input>
  superRefine(
    refinement: (arg: Output, ctx: RefinementCtx) => unknown | Promise<unknown>
  ): IZodEffects<this, Output, Input> {
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

  optional(): IZodOptional<this> {
    return builders.optional(this, this._def) // TODO(why): find out why def is passed as second argument
  }
  nullable(): IZodNullable<this> {
    return builders.nullable(this, this._def) // TODO(why): find out why def is passed as second argument
  }
  nullish(): IZodOptional<IZodNullable<this>> {
    return this.nullable().optional()
  }
  array(): IZodArray<this> {
    return builders.array(this, this._def) // TODO(why): find out why def is passed as second argument
  }
  promise(): IZodPromise<this> {
    return builders.promise(this, this._def) // TODO(why): find out why def is passed as second argument
  }
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
  mandatory(): IZodBaseType {
    return this
  }

  or<T extends IZodBaseType>(option: T): IZodUnion<[this, T]> {
    return builders.union([this, option])
  }

  and<T extends IZodBaseType>(incoming: T): IZodIntersection<this, T> {
    return builders.intersection(this, incoming)
  }

  transform<NewOut>(
    transform: (arg: Output, ctx: RefinementCtx) => NewOut | Promise<NewOut>
  ): IZodEffects<this, NewOut> {
    return builders.effects(this, {
      type: 'transform',
      transform,
    })
  }

  default(def: utils.types.NoUndefined<Input>): IZodDefault<this>
  default(def: () => utils.types.NoUndefined<Input>): IZodDefault<this>
  default(def: any) {
    const defaultValueFunc = typeof def === 'function' ? def : () => def
    return builders.default(this, defaultValueFunc)
  }

  brand(): IZodBranded<this> {
    return builders.branded(this)
  }

  catch(catcher: Output | CatchFn<Output>): IZodCatch<this> {
    return builders.catch(this, catcher)
  }

  describe(description: string): this {
    const clone = this.clone() as this
    clone._metadataRoot._def.description = description
    return clone
  }

  pipe<T extends IZodBaseType>(target: T): IZodPipeline<this, T> {
    return builders.pipeline(this, target)
  }

  readonly(): IZodReadonly<this> {
    return builders.readonly(this)
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
    const clone = this.clone() as this
    const root = clone._metadataRoot
    root._def[zuiKey] ??= {}
    for (const [key, value] of Object.entries(data)) {
      root._def[zuiKey] = {
        ...root._def[zuiKey],
        [key]: value,
      }
    }
    return clone
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
  get _metadataRoot(): IZodBaseType {
    return this.naked()
  }

  displayAs<
    UI extends UIComponentDefinitions = UIComponentDefinitions,
    Type extends BaseDisplayAsType = BaseDisplayAsType,
  >(options: DisplayAsOptions<UI[Type][keyof UI[Type]]>): this {
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
    value?: boolean | ((shape: T | null) => DeepPartialBoolean<T> | boolean)
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
    value?: boolean | ((shape: T | null) => DeepPartialBoolean<T> | boolean)
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

  /**
   *
   * @returns a JSON Schema equivalent to the Zui schema
   */
  toJSONSchema(): transforms.ZuiJSONSchema {
    throw new _CircularDependencyError('toJSONSchema')
  }

  /**
   *
   * @param options generation options
   * @returns a string of the TypeScript type representing the schema
   */
  toTypescriptType(_opts?: transforms.TypescriptGenerationOptions): string {
    throw new _CircularDependencyError('toTypescriptType')
  }

  /**
   *
   * @param options generation options
   * @returns a typescript program (a string) that would construct the given schema if executed
   */
  toTypescriptSchema(): string {
    throw new _CircularDependencyError('toTypescriptSchema')
  }

  /**
   * Allows removing all wrappers around the schema
   * @returns either this or the closest children schema that represents the actual data
   */
  naked(): IZodBaseType {
    return this
  }

  private _handleResult = <Input, Output>(
    ctx: ParseContext,
    result: SyncParseReturnType<Output>
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

  // TODO: this is an ugly workaround to prevent from exposing internal methods in the public API. We should find something better.
  protected static fromInterface(t: IZodBaseType): ZodBaseTypeImpl {
    return t as ZodBaseTypeImpl
  }
}
