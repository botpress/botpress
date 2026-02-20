import {
  //
  ZodType,
  ZodTypeDef,
  INVALID,
  ParseInput,
  ParseReturnType,
  addIssueToContext,
} from '../basetype'

export type ZodRefDef = {
  typeName: 'ZodRef'
  uri: string
} & ZodTypeDef

export class ZodRef extends ZodType<NonNullable<unknown>, ZodRefDef> {
  dereference(defs: Record<string, ZodType>): ZodType {
    const def = defs[this._def.uri]
    if (!def) {
      return this
    }
    return def
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

  static create = (uri: string): ZodRef => {
    return new ZodRef({
      typeName: 'ZodRef',
      uri,
    })
  }

  public override isOptional(): boolean {
    return false
  }

  public override isNullable(): boolean {
    return false
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodRef)) return false
    return this._def.uri === schema._def.uri
  }
}
