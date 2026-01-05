import {
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeDef,
  INVALID,
  ParseInput,
  ParseReturnType,
  ZodTypeAny,
  addIssueToContext,
  ZodIssueCode,
} from '../index'

export interface ZodRefDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodRef
  uri: string
}

type ZodRefOutput = NonNullable<unknown>

export class ZodRef extends ZodType<ZodRefOutput, ZodRefDef> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
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
      code: ZodIssueCode.unresolved_reference,
    })
    return INVALID
  }

  static create = (uri: string): ZodRef => {
    return new ZodRef({
      typeName: ZodFirstPartyTypeKind.ZodRef,
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
