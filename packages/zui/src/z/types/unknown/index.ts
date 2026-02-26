import type { IZodUnknown, ZodUnknownDef } from '../../typings'
import { ZodBaseTypeImpl, OK, ParseInput, ParseReturnType } from '../basetype'

export class ZodUnknownImpl extends ZodBaseTypeImpl<unknown, ZodUnknownDef> implements IZodUnknown {
  // required
  _unknown = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return OK(input.data)
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    return schema instanceof ZodUnknownImpl
  }
}
