import {
  ZodIssueCode,
  processCreateParams,
  util,
  ZodParsedType,
  errorUtil,
  ZodFirstPartyTypeKind,
  ZodTypeDef,
  addIssueToContext,
  INVALID,
  ParseContext,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  ZodType,
  RawCreateParams,
} from '../index'
import { CustomSet } from '../utils/custom-set'

export type ZodDateCheck =
  | { kind: 'min'; value: number; message?: string }
  | { kind: 'max'; value: number; message?: string }
export interface ZodDateDef extends ZodTypeDef {
  checks: ZodDateCheck[]
  coerce: boolean
  typeName: ZodFirstPartyTypeKind.ZodDate
}

export class ZodDate extends ZodType<Date, ZodDateDef> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    if (this._def.coerce) {
      input.data = new Date(input.data)
    }
    const parsedType = this._getType(input)

    if (parsedType !== ZodParsedType.date) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx.parsedType,
      })
      return INVALID
    }

    if (isNaN(input.data.getTime())) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_date,
      })
      return INVALID
    }

    const status = new ParseStatus()
    let ctx: undefined | ParseContext = undefined

    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: 'date',
          })
          status.dirty()
        }
      } else if (check.kind === 'max') {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: 'date',
          })
          status.dirty()
        }
      } else {
        util.assertNever(check)
      }
    }

    return {
      status: status.value,
      value: new Date((input.data as Date).getTime()),
    }
  }

  _addCheck(check: ZodDateCheck) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }

  min(minDate: Date, message?: errorUtil.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      value: minDate.getTime(),
      message: errorUtil.toString(message),
    })
  }

  max(maxDate: Date, message?: errorUtil.ErrMessage) {
    return this._addCheck({
      kind: 'max',
      value: maxDate.getTime(),
      message: errorUtil.toString(message),
    })
  }

  get minDate() {
    let min: number | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }

    return min != null ? new Date(min) : null
  }

  get maxDate() {
    let max: number | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }

    return max != null ? new Date(max) : null
  }

  static create = (params?: RawCreateParams & { coerce?: boolean }): ZodDate => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodDate)) return false
    const thisChecks = new CustomSet<ZodDateCheck>(this._def.checks)
    const thatChecks = new CustomSet<ZodDateCheck>(schema._def.checks)
    return thisChecks.isEqual(thatChecks) && this._def.coerce === schema._def.coerce
  }
}
