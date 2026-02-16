import { ZodType, ZodTypeDef } from '../index'
import { ParseInput, ParseReturnType } from '../utils/parseUtil'

type Key = string | number | symbol

export type ZodBrandedDef<T extends ZodType = ZodType> = {
  type: T
  typeName: 'ZodBranded'
} & ZodTypeDef

export const BRAND: unique symbol = Symbol('zod_brand')
export type BRAND<T extends Key = Key> = {
  [BRAND]: {
    [k in T]: true
  }
}

export class ZodBranded<T extends ZodType = ZodType, B extends Key = Key> extends ZodType<
  T['_output'] & BRAND<B>,
  ZodBrandedDef<T>,
  T['_input']
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    return new ZodBranded({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
  }

  clone(): ZodBranded<T, B> {
    return new ZodBranded({
      ...this._def,
      type: this._def.type.clone(),
    }) as ZodBranded<T, B>
  }

  _parse(input: ParseInput): ParseReturnType<any> {
    const { ctx } = this._processInputParams(input)
    const data = ctx.data
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }

  unwrap() {
    return this._def.type
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodBranded)) return false
    return this._def.type.isEqual(schema._def.type)
  }

  naked(): ZodType {
    return this._def.type.naked()
  }

  mandatory(): ZodBranded<ZodType, B> {
    return new ZodBranded({
      ...this._def,
      type: this._def.type.mandatory(),
    })
  }
}
