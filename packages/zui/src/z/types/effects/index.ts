import * as utils from '../../../utils'
import { is } from '../../guards'
import type {
  IZodEffects,
  IZodType,
  ZodEffectsDef,
  input,
  output,
  RefinementCtx,
  IssueData,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, isAborted, isValid } from '../basetype'

export class ZodEffectsImpl<T extends IZodType = IZodType, Output = output<T>, Input = input<T>>
  extends ZodBaseTypeImpl<Output, ZodEffectsDef<T>, Input>
  implements IZodEffects<T, Output, Input>
{
  innerType() {
    return this._def.schema
  }

  /**
   * @deprecated use naked() instead
   */
  sourceType(): T {
    return is.zuiEffects(this._def.schema)
      ? (this._def.schema.sourceType() as T) // this cast is a lie
      : (this._def.schema as T)
  }

  dereference(defs: Record<string, IZodType>): IZodEffects {
    return new ZodEffectsImpl({
      ...this._def,
      schema: this._def.schema.dereference(defs),
    }) as IZodEffects
  }

  getReferences(): string[] {
    return this._def.schema.getReferences()
  }

  clone(): IZodEffects<T, Output, Input> {
    return new ZodEffectsImpl({
      ...this._def,
      schema: this._def.schema.clone() as T,
    }) as IZodEffects<T, Output, Input>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)

    const effect = this._def.effect

    const checkCtx: RefinementCtx = {
      addIssue: (arg: IssueData) => {
        addIssueToContext(ctx, arg)
        if (arg.fatal) {
          status.abort()
        } else {
          status.dirty()
        }
      },
      get path() {
        return ctx.path
      },
    }

    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx)

    if (effect.type === 'preprocess') {
      const processed = effect.preprocess(ctx.data, checkCtx)

      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed) => {
          if (status.value === 'aborted') return { status: 'aborted' }

          const result = await this._def.schema._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx,
          })
          if (result.status === 'aborted') return { status: 'aborted' }
          if (result.status === 'dirty') return { status: 'dirty', value: result.value }
          if (status.value === 'dirty') return { status: 'dirty', value: result.value }
          return result
        })
      } else {
        if (status.value === 'aborted') return { status: 'aborted' }
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx,
        })
        if (result.status === 'aborted') return { status: 'aborted' }
        if (result.status === 'dirty') return { status: 'dirty', value: result.value }
        if (status.value === 'dirty') return { status: 'dirty', value: result.value }
        return result
      }
    }
    if (effect.type === 'postprocess') {
      const executePostprocess = (base: SyncParseReturnType) => {
        if (isAborted(base)) return base
        if (base.status === 'dirty') status.dirty()

        const result = effect.postprocess(base.value, checkCtx)
        if (ctx.common.async === false) {
          if (result instanceof Promise) {
            throw new Error(
              'Asynchronous postprocess encountered during synchronous parse operation. Use .parseAsync instead.'
            )
          }
          // If the postprocess itself returned aborted, respect that
          if (isAborted(result)) return result
          // Merge: take the worst of the postprocess result status and accumulated status
          if (result.status === 'dirty') status.dirty()
          return { status: status.value, value: result.value } as ParseReturnType<this['_output']>
        } else {
          return Promise.resolve(result).then((result) => {
            if (isAborted(result)) return result
            if (result.status === 'dirty') status.dirty()
            return { status: status.value, value: result.value }
          }) as ParseReturnType<this['_output']>
        }
      }

      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        return executePostprocess(base)
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          return executePostprocess(base)
        }) as ParseReturnType<this['_output']>
      }
    }

    utils.assert.assertNever(effect)
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodEffectsImpl)) return false
    if (!this._def.schema.isEqual(schema._def.schema)) return false

    if (this._def.effect.type === 'preprocess') {
      if (schema._def.effect.type !== 'preprocess') return false
      return utils.others.compareFunctions(this._def.effect.preprocess, schema._def.effect.preprocess)
    }

    if (this._def.effect.type === 'postprocess') {
      if (schema._def.effect.type !== 'postprocess') return false
      return utils.others.compareFunctions(this._def.effect.postprocess, schema._def.effect.postprocess)
    }

    this._def.effect satisfies never
    return false
  }

  naked() {
    return this._def.schema.naked()
  }

  mandatory(): IZodEffects<IZodType> {
    return new ZodEffectsImpl({
      ...this._def,
      schema: this._def.schema.mandatory(),
    }) as IZodEffects<IZodType>
  }
}
