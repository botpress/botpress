import { unique } from '../../utils'
import {
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  DIRTY,
  INVALID,
  ParseInput,
  ParseReturnType,
} from '../index'

export interface ZodPipelineDef<A extends ZodTypeAny = ZodTypeAny, B extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  in: A
  out: B
  typeName: ZodFirstPartyTypeKind.ZodPipeline
}

export class ZodPipeline<A extends ZodTypeAny = ZodTypeAny, B extends ZodTypeAny = ZodTypeAny> extends ZodType<
  B['_output'],
  ZodPipelineDef<A, B>,
  A['_input']
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodPipeline({
      ...this._def,
      in: this._def.in.dereference(defs),
      out: this._def.out.dereference(defs),
    })
  }

  getReferences(): string[] {
    return unique([...this._def.in.getReferences(), ...this._def.out.getReferences()])
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

  static create<A extends ZodTypeAny, B extends ZodTypeAny>(a: A, b: B): ZodPipeline<A, B> {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline,
    })
  }
}
