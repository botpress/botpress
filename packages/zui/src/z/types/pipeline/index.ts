import * as utils from '../../utils'
import { ZodBaseTypeImpl, DIRTY, INVALID, ParseInput, ParseReturnType } from '../basetype'
import type { IZodPipeline, IZodType, ZodPipelineDef } from '../../typings'
export type { ZodPipelineDef }

export class ZodPipelineImpl<A extends IZodType = IZodType, B extends IZodType = IZodType>
  extends ZodBaseTypeImpl<B['_output'], ZodPipelineDef<A, B>, A['_input']>
  implements IZodPipeline<A, B>
{
  dereference(defs: Record<string, IZodType>): ZodBaseTypeImpl {
    return new ZodPipelineImpl({
      ...this._def,
      in: this._def.in.dereference(defs),
      out: this._def.out.dereference(defs),
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([...this._def.in.getReferences(), ...this._def.out.getReferences()])
  }

  clone(): IZodPipeline<A, B> {
    return new ZodPipelineImpl({
      ...this._def,
      in: this._def.in.clone() as A,
      out: this._def.out.clone() as B,
    })
  }

  _parse(input: ParseInput): ParseReturnType<any> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await ZodBaseTypeImpl.fromInterface(this._def.in)._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inResult.status === 'aborted') return INVALID
        if (inResult.status === 'dirty') {
          status.dirty()
          return DIRTY(inResult.value)
        } else {
          return ZodBaseTypeImpl.fromInterface(this._def.out)._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx,
          })
        }
      }
      return handleAsync()
    } else {
      const inResult = ZodBaseTypeImpl.fromInterface(this._def.in)._parseSync({
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
        return ZodBaseTypeImpl.fromInterface(this._def.out)._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx,
        })
      }
    }
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodPipelineImpl)) return false
    if (!this._def.in.isEqual(schema._def.in)) return false
    if (!this._def.out.isEqual(schema._def.out)) return false
    return true
  }
}
