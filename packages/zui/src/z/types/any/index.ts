import type { IZodAny, IZodType, ZodAnyDef, ParseReturnType, ParseInput } from '../../typings'
import { ZodBaseTypeImpl, OK } from '../basetype'

export class ZodAnyImpl extends ZodBaseTypeImpl<any, ZodAnyDef> implements IZodAny {
  // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
  _any = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return OK(input.data)
  }
  public isEqual(schema: IZodType) {
    return schema instanceof ZodAnyImpl
  }
}
