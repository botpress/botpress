import { RawCreateParams, ZodType, ZodTypeDef } from '../basetype'
import { processCreateParams } from '../utils'
import { OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export type ZodAnyDef = {
  typeName: 'ZodAny'
} & ZodTypeDef

export class ZodAny extends ZodType<any, ZodAnyDef> {
  // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
  _any = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return OK(input.data)
  }
  static create = (params?: RawCreateParams): ZodAny => {
    return new ZodAny({
      typeName: 'ZodAny',
      ...processCreateParams(params),
    })
  }

  public isEqual(schema: ZodType) {
    return schema instanceof ZodAny
  }
}
