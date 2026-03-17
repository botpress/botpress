import * as utils from '../../../utils'
import { is } from '../../guards'
import type {
  IZodEffects,
  IZodType,
  ZodEffectsDef,
  input,
  output,
  ParseInput,
  ParseReturnType,
  EffectReturnType,
  ParseContext,
} from '../../typings'
import { ParseStatus, ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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

    if (effect.type === 'upstream') {
      let processed = effect.effect(ctx.data, { path: ctx.path })

      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed) => {
          processed ??= { status: 'valid', value: ctx.data }
          this._processResult(ctx, status, processed)

          if (status.value === 'aborted') return { status: 'aborted' }

          const result = await this._def.schema._parseAsync({
            data: (processed as Exclude<EffectReturnType<unknown>, { status: 'aborted' }>).value,
            path: ctx.path,
            parent: ctx,
          })
          if (result.status === 'aborted') return { status: 'aborted' }
          if (result.status === 'dirty') return { status: 'dirty', value: result.value }
          if (status.value === 'dirty') return { status: 'dirty', value: result.value }
          return result
        })
      } else {
        if (processed instanceof Promise) {
          throw new Error(
            'Asynchronous upstream transform encountered during synchronous parse operation. Use .parseAsync instead.'
          )
        }
        processed ??= { status: 'valid', value: ctx.data }
        this._processResult(ctx, status, processed)

        if (status.value === 'aborted') return { status: 'aborted' }
        const result = this._def.schema._parseSync({
          data: (processed as Exclude<EffectReturnType<unknown>, { status: 'aborted' }>).value,
          path: ctx.path,
          parent: ctx,
        })
        if (result.status === 'aborted') return { status: 'aborted' }
        if (result.status === 'dirty') return { status: 'dirty', value: result.value }
        if (status.value === 'dirty') return { status: 'dirty', value: result.value }
        return result
      }
    }

    if (effect.type === 'downstream') {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })

        if (base.status === 'aborted') return base
        if (base.status === 'dirty') {
          status.dirty()
          if (effect.failFast) {
            return base
          }
        }

        let result = effect.effect(base.value, { path: ctx.path })
        if (result instanceof Promise) {
          throw new Error(
            'Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.'
          )
        }

        result ??= { status: 'valid', value: base.value }
        this._processResult(ctx, status, result)

        return {
          status: status.value,
          value: result.status === 'valid' ? result.value : base.value,
        }
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (base.status === 'aborted') return base
          if (base.status === 'dirty') {
            status.dirty()
            if (effect.failFast) {
              return base
            }
          }

          return Promise.resolve(effect.effect(base.value, { path: ctx.path })).then((result) => {
            result ??= { status: 'valid', value: base.value }
            this._processResult(ctx, status, result)

            return {
              status: status.value,
              value: result.status === 'valid' ? result.value : base.value,
            }
          })
        }) as ParseReturnType<this['_output']>
      }
    }

    utils.assert.assertNever(effect)
  }

  private _processResult(ctx: ParseContext, status: ParseStatus, result: EffectReturnType<unknown>): void {
    if (result.status === 'valid') {
      return
    }

    if (result.status === 'aborted') {
      status.abort()
    } else if (result.status === 'dirty') {
      status.dirty()
    }

    for (const issue of result.issues) {
      addIssueToContext(ctx, issue)
    }
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodEffectsImpl)) return false
    if (!this._def.schema.isEqual(schema._def.schema)) return false

    if (this._def.effect.type === 'upstream') {
      if (schema._def.effect.type !== 'upstream') return false
      return utils.others.compareFunctions(this._def.effect.effect, schema._def.effect.effect)
    }

    if (this._def.effect.type === 'downstream') {
      if (schema._def.effect.type !== 'downstream') return false
      return utils.others.compareFunctions(this._def.effect.effect, schema._def.effect.effect)
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
