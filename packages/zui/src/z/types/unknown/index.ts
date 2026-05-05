import type { IZodUnknown, IZodType, ZodUnknownDef, ParseInput, ParseReturnType } from '../../typings'
import { ZodBaseTypeImpl } from '../basetype'

export class ZodUnknownImpl extends ZodBaseTypeImpl<unknown, ZodUnknownDef> implements IZodUnknown {
  // required
  _unknown = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return { status: 'valid', value: input.data }
  }

  isEqual(schema: IZodType): boolean {
    return schema instanceof ZodUnknownImpl
  }
}
