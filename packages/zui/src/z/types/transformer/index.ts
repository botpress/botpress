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
} from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext, isValid } from '../basetype'

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

  dereference(defs: Record<string, IZodType>): IZodType {
    return new ZodEffectsImpl({
      ...this._def,
      schema: this._def.schema.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.schema.getReferences()
  }

  clone(): IZodEffects<T, Output, Input> {
    return new ZodEffectsImpl({
      ...this._def,
      schema: this._def.schema.clone() as T,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)

    const effect = this._def.effect || null

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
      const processed = effect.transform(ctx.data, checkCtx)

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
    if (effect.type === 'refinement') {
      const executeRefinement = (acc: unknown): unknown => {
        const result = effect.refinement(acc, checkCtx)
        if (ctx.common.async) {
          return Promise.resolve(result)
        }
        if (result instanceof Promise) {
          throw new Error('Async refinement encountered during synchronous parse operation. Use .parseAsync instead.')
        }
        return acc
      }

      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inner.status === 'aborted') return { status: 'aborted' }
        if (inner.status === 'dirty') status.dirty()

        // return value is ignored
        executeRefinement(inner.value)
        return { status: status.value, value: inner.value }
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === 'aborted') return { status: 'aborted' }
          if (inner.status === 'dirty') status.dirty()

          return (executeRefinement(inner.value) as Promise<unknown>).then(() => {
            return { status: status.value, value: inner.value }
          })
        })
      }
    }

    if (effect.type === 'transform') {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })

        if (!isValid(base)) return base

        const result = effect.transform(base.value, checkCtx)
        if (result instanceof Promise) {
          throw new Error(
            'Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.'
          )
        }

        return { status: status.value, value: result }
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base)) return base

          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result,
          }))
        })
      }
    }

    utils.assert.assertNever(effect)
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodEffectsImpl)) return false
    if (!this._def.schema.isEqual(schema._def.schema)) return false

    if (this._def.effect.type === 'refinement') {
      if (schema._def.effect.type !== 'refinement') return false
      return utils.others.compareFunctions(this._def.effect.refinement, schema._def.effect.refinement)
    }

    if (this._def.effect.type === 'transform') {
      if (schema._def.effect.type !== 'transform') return false
      return utils.others.compareFunctions(this._def.effect.transform, schema._def.effect.transform)
    }

    if (this._def.effect.type === 'preprocess') {
      if (schema._def.effect.type !== 'preprocess') return false
      return utils.others.compareFunctions(this._def.effect.transform, schema._def.effect.transform)
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
    })
  }
}
