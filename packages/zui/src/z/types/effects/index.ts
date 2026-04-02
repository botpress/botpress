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
  ValidParseReturnType,
} from '../../typings'
import { ZodBaseTypeImpl, addIssueToContext } from '../basetype'

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
    const { ctx } = this._processInputParams(input)

    const effect = this._def.effect

    if (effect.type === 'upstream') {
      let processed = effect.effect(ctx.data, { path: ctx.path })

      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed) => {
          processed ??= { status: 'valid', value: ctx.data }
          this._processResult(ctx, processed)

          if (processed.status === 'aborted') return { status: 'aborted' }

          const result = await this._def.schema._parseAsync({
            data: processed.value,
            path: ctx.path,
            parent: ctx,
          })
          if (result.status === 'aborted') return { status: 'aborted' }
          if (result.status === 'dirty') return { status: 'dirty', value: result.value }
          if (processed.status === 'dirty') return { status: 'dirty', value: result.value }
          return result
        })
      } else {
        if (processed instanceof Promise) {
          throw new Error(
            'Asynchronous upstream transform encountered during synchronous parse operation. Use .parseAsync instead.'
          )
        }
        processed ??= { status: 'valid', value: ctx.data }
        this._processResult(ctx, processed)

        if (processed.status === 'aborted') return { status: 'aborted' }

        const result = this._def.schema._parseSync({
          data: processed.value,
          path: ctx.path,
          parent: ctx,
        })
        if (result.status === 'aborted') return { status: 'aborted' }
        if (result.status === 'dirty') return { status: 'dirty', value: result.value }
        if (processed.status === 'dirty') return { status: 'dirty', value: result.value }
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
        this._processResult(ctx, result)

        if (result.status === 'aborted') return { status: 'aborted' }
        if (result.status === 'dirty') return { status: 'dirty', value: result.value as this['_output'] }
        if (base.status === 'dirty') return { status: 'dirty', value: result.value as this['_output'] }
        return result as ValidParseReturnType<this['_output']>
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (base.status === 'aborted') return base
          if (base.status === 'dirty') {
            if (effect.failFast) {
              return base
            }
          }

          return Promise.resolve(effect.effect(base.value, { path: ctx.path })).then(
            (result): ParseReturnType<this['_output']> => {
              result ??= { status: 'valid', value: base.value }
              this._processResult(ctx, result)

              if (result.status === 'aborted') return { status: 'aborted' }
              if (result.status === 'dirty') return { status: 'dirty', value: result.value as this['_output'] }
              if (base.status === 'dirty') return { status: 'dirty', value: result.value as this['_output'] }
              return result as ValidParseReturnType<this['_output']>
            }
          )
        })
      }
    }

    utils.assert.assertNever(effect)
  }

  private _processResult(ctx: ParseContext, result: EffectReturnType<unknown>): void {
    if (result.status === 'valid') {
      return
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
      if (this._def.effect.failFast !== schema._def.effect.failFast) return false
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
