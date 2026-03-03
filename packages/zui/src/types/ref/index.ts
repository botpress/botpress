import type { IZodRef, IZodType, ZodRefDef } from '../../typings'
import {
  //
  ZodBaseTypeImpl,
  INVALID,
  ParseInput,
  ParseReturnType,
  addIssueToContext,
} from '../basetype'
export type { ZodRefDef }

export class ZodRefImpl extends ZodBaseTypeImpl<NonNullable<unknown>, ZodRefDef> implements IZodRef {
  dereference(defs: Record<string, IZodType>): ZodBaseTypeImpl {
    const def = defs[this._def.uri]
    if (!def) {
      return this
    }
    return def as ZodBaseTypeImpl
  }

  getReferences(): string[] {
    return [this._def.uri]
  }

  _parse(input: ParseInput): ParseReturnType<never> {
    // a schema containing references should never be used to parse data
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: 'unresolved_reference',
    })
    return INVALID
  }

  public override isOptional(): boolean {
    return false
  }

  public override isNullable(): boolean {
    return false
  }

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodRefImpl)) return false
    return this._def.uri === schema._def.uri
  }
}
