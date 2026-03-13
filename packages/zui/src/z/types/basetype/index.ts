import type * as transforms from '../../../transforms'
import * as utils from '../../../utils'
import { zuiKey } from '../../consts'
import { ZodError } from '../../error'
import { builders } from '../../internal-builders'
import type {
  BaseDisplayAsType,
  DisplayAsOptions,
  UIComponentDefinitions,
  ZodKindToBaseType,
  ZuiMetadata,
  DeepPartialBoolean,
  IZodType,
  ZodTypeDef,
  SafeParseReturnType,
  CatchFn,
  IZodArray,
  IZodBranded,
  IZodCatch,
  IZodIntersection,
  IZodNullable,
  IZodOptional,
  IZodPipeline,
  IZodPromise,
  IZodReadonly,
  IZodEffects,
  IZodUnion,
  RefinementCtx,
  CustomErrorParams,
  ParseContext,
  ParseInput,
  ParseParams,
  ParseReturnType,
  AsyncParseReturnType,
  SyncParseReturnType,
} from '../../typings'

import { getParsedType, isAsync, isValid, ParseStatus } from './parseUtil'

export * from './parseUtil'

class _CircularDependencyError extends Error {
  public constructor(propName: keyof IZodType) {
    super(
      `Cannot access property ${propName} before initialization. You're probably importing ZUI incorrectly. If not, reach out to the maintainers.`
    )
  }
}

export abstract class ZodBaseTypeImpl<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output>
  implements IZodType<Output, Def, Input>
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

  dereference(_defs: Record<string, IZodType>): IZodType {
    return this
  }

  getReferences(): string[] {
    return []
  }

  clone(): IZodType<Output, Def, Input> {
    const This = (this as any).constructor
    return new This({
      ...this._def,
    })
  }

  abstract isEqual(schema: IZodType): boolean

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

  spa = this.safeParseAsync

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
    return this.postprocess((val: Output, ctx: RefinementCtx) => {
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
            return { status: 'dirty', value: val }
          }
          return { status: 'valid', value: val }
        })
      }
      if (!result) {
        setError()
        return { status: 'dirty', value: val }
      }
      return { status: 'valid', value: val }
    })
  }

  constructor(def: Def) {
    this._def = def
    this.parse = this.parse.bind(this)
    this.safeParse = this.safeParse.bind(this)
    this.parseAsync = this.parseAsync.bind(this)
    this.safeParseAsync = this.safeParseAsync.bind(this)
    this.spa = this.spa.bind(this)
    this.refine = this.refine.bind(this)
    this.optional = this.optional.bind(this)
    this.nullable = this.nullable.bind(this)
    this.nullish = this.nullish.bind(this)
    this.array = this.array.bind(this)
    this.promise = this.promise.bind(this)
    this.or = this.or.bind(this)
    this.and = this.and.bind(this)
    this.transform = this.transform.bind(this)
    this.postprocess = this.postprocess.bind(this)
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

  mandatory(): IZodType {
    return this
  }

  or<T extends IZodType>(option: T): IZodUnion<[this, T]> {
    return builders.union([this, option])
  }

  and<T extends IZodType>(incoming: T): IZodIntersection<this, T> {
    return builders.intersection(this, incoming)
  }

  transform<NewOut>(
    transform: (arg: Output, ctx: RefinementCtx) => NewOut | Promise<NewOut>
  ): IZodEffects<this, NewOut> {
    return this.postprocess(async (arg: Output, ctx: RefinementCtx) => {
      const result = await transform(arg, ctx)
      return { status: 'valid' as const, value: result }
    })
  }

  postprocess<NewOut>(
    postprocess: (arg: Output, ctx: RefinementCtx) => SyncParseReturnType<NewOut> | Promise<SyncParseReturnType<NewOut>>
  ): IZodEffects<this, NewOut> {
    return builders.postprocess(this, postprocess)
  }

  default(def: utils.types.NoUndefined<Input> | (() => utils.types.NoUndefined<Input>)) {
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

  pipe<T extends IZodType>(target: T): IZodPipeline<this, T> {
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

  getMetadata(): Record<string, ZuiMetadata> {
    return { ...this._metadataRoot._def[zuiKey] }
  }

  setMetadata(data: Record<string, ZuiMetadata>): void {
    this._metadataRoot._def[zuiKey] = { ...data }
  }

  get ui(): Record<string, ZuiMetadata> {
    return { ...this._metadataRoot._def[zuiKey] }
  }

  /**
   * Some Schemas aren't meant to contain metadata, like ZodDefault.
   * In a zui construction like `z.string().default('hello').title('Hello')`, the user's intention is usually to set a title on the string, not on the default value.
   * Also, in JSON-Schema, default is not a data-type like it is in Zui, but an annotation added on the schema itself. Therefore, only one metadata can apply to both the schema and the default value.
   * This property is used to get the root schema that should contain the metadata.
   */
  get _metadataRoot(): IZodType {
    return this.naked()
  }

  displayAs<
    UI extends UIComponentDefinitions = UIComponentDefinitions,
    Type extends BaseDisplayAsType = ZodKindToBaseType<this['_def']>,
  >(options: DisplayAsOptions<UI[Type][keyof UI[Type]]>): this {
    return this.metadata({ displayAs: [options.id, options.params] })
  }

  title(title: string): this {
    return this.metadata({ title })
  }

  hidden<T = this['_output']>(value?: boolean | ((shape: T | null) => DeepPartialBoolean<T> | boolean)): this {
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

  disabled<T = this['_output']>(value?: boolean | ((shape: T | null) => DeepPartialBoolean<T> | boolean)): this {
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

  placeholder(placeholder: string): this {
    return this.metadata({ placeholder })
  }

  toJSONSchema(): transforms.json.Schema {
    throw new _CircularDependencyError('toJSONSchema')
  }

  toTypescriptType(_opts?: transforms.TypescriptGenerationOptions): string {
    throw new _CircularDependencyError('toTypescriptType')
  }

  toTypescriptSchema(): string {
    throw new _CircularDependencyError('toTypescriptSchema')
  }

  naked(): IZodType {
    return this
  }

  private _handleResult = (
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
          // TODO(why): find out why we cast as any and set a property that isn't defined above as a class property
          if ((this as any)._error) return (this as any)._error as Error
          const error = new ZodError(ctx.common.issues)
          ;(this as any)._error = error
          return (this as any)._error
        },
      }
    }
  }
}
