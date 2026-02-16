import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { processCreateParams } from '../utils'
import { OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export type ZodUnknownDef = {
  typeName: 'ZodUnknown'
} & ZodTypeDef

export class ZodUnknown extends ZodType<unknown, ZodUnknownDef> {
  // required
  _unknown = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return OK(input.data)
  }

  static create = (params?: RawCreateParams): ZodUnknown => {
    return new ZodUnknown({
      typeName: 'ZodUnknown',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return schema instanceof ZodUnknown
  }
}
