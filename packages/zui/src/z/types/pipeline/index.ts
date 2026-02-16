import { unique } from '../../utils'
import { ZodType, ZodTypeDef, DIRTY, INVALID, ParseInput, ParseReturnType } from '../index'

export type ZodPipelineDef<A extends ZodType = ZodType, B extends ZodType = ZodType> = {
  in: A
  out: B
  typeName: 'ZodPipeline'
} & ZodTypeDef

export class ZodPipeline<A extends ZodType = ZodType, B extends ZodType = ZodType> extends ZodType<
  B['_output'],
  ZodPipelineDef<A, B>,
  A['_input']
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodPipeline({
      ...this._def,
      in: this._def.in.dereference(defs),
      out: this._def.out.dereference(defs),
    })
  }

  getReferences(): string[] {
    return unique([...this._def.in.getReferences(), ...this._def.out.getReferences()])
  }

  clone(): ZodPipeline<A, B> {
    return new ZodPipeline({
      ...this._def,
      in: this._def.in.clone(),
      out: this._def.out.clone(),
    }) as ZodPipeline<A, B>
  }

  _parse(input: ParseInput): ParseReturnType<any> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inResult.status === 'aborted') return INVALID
        if (inResult.status === 'dirty') {
          status.dirty()
          return DIRTY(inResult.value)
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx,
          })
        }
      }
      return handleAsync()
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      })
      if (inResult.status === 'aborted') return INVALID
      if (inResult.status === 'dirty') {
        status.dirty()
        return {
          status: 'dirty',
          value: inResult.value,
        }
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx,
        })
      }
    }
  }

  static create<A extends ZodType, B extends ZodType>(a: A, b: B): ZodPipeline<A, B> {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: 'ZodPipeline',
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodPipeline)) return false
    if (!this._def.in.isEqual(schema._def.in)) return false
    if (!this._def.out.isEqual(schema._def.out)) return false
    return true
  }
}
