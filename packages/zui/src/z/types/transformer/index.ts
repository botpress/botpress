import type { IZodEffects, IZodType, ZodEffectsDef, input, output, RefinementCtx, IssueData } from '../../typings'
import * as utils from '../../utils'
import { ZodBaseTypeImpl, addIssueToContext, DIRTY, INVALID, isValid, ParseInput, ParseReturnType } from '../basetype'

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
    return this._def.schema._def.typeName === 'ZodEffects'
      ? (this._def.schema as unknown as IZodEffects<T>).sourceType()
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
          if (status.value === 'aborted') return INVALID

          const result = await ZodEffectsImpl.fromInterface(this._def.schema)._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx,
          })
          if (result.status === 'aborted') return INVALID
          if (result.status === 'dirty') return DIRTY(result.value)
          if (status.value === 'dirty') return DIRTY(result.value)
          return result
        })
      } else {
        if (status.value === 'aborted') return INVALID
        const result = ZodEffectsImpl.fromInterface(this._def.schema)._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx,
        })
        if (result.status === 'aborted') return INVALID
        if (result.status === 'dirty') return DIRTY(result.value)
        if (status.value === 'dirty') return DIRTY(result.value)
        return result
      }
    }
    if (effect.type === 'refinement') {
      const executeRefinement = (acc: unknown): any => {
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
        const inner = ZodEffectsImpl.fromInterface(this._def.schema)._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inner.status === 'aborted') return INVALID
        if (inner.status === 'dirty') status.dirty()

        // return value is ignored
        executeRefinement(inner.value)
        return { status: status.value, value: inner.value }
      } else {
        return ZodEffectsImpl.fromInterface(this._def.schema)
          ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
          .then((inner) => {
            if (inner.status === 'aborted') return INVALID
            if (inner.status === 'dirty') status.dirty()

            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value }
            })
          })
      }
    }

    if (effect.type === 'transform') {
      if (ctx.common.async === false) {
        const base = ZodEffectsImpl.fromInterface(this._def.schema)._parseSync({
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
        return ZodEffectsImpl.fromInterface(this._def.schema)
          ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
          .then((base) => {
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

    type _assertion = utils.assert.AssertNever<typeof this._def.effect>
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
