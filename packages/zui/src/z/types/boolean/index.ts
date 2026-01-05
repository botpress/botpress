import {
  ZodIssueCode,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export interface ZodBooleanDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodBoolean
  coerce: boolean
}

export class ZodBoolean extends ZodType<boolean, ZodBooleanDef> {
  _parse(input: ParseInput): ParseReturnType<boolean> {
    if (this._def.coerce) {
      input.data = Boolean(input.data)
    }
    const parsedType = this._getType(input)

    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  static create = (params?: RawCreateParams & { coerce?: boolean }): ZodBoolean => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodBoolean)) return false
    return this._def.coerce === schema._def.coerce
  }
}
