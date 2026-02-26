import { type IZodDate, ZodDateCheck, ZodDateDef } from '../../typings'
import * as utils from '../../utils'
import {
  addIssueToContext,
  INVALID,
  ParseContext,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  ZodBaseTypeImpl,
} from '../basetype'

export class ZodDateImpl extends ZodBaseTypeImpl<Date, ZodDateDef> implements IZodDate {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    if (this._def.coerce) {
      input.data = new Date(input.data)
    }
    const parsedType = this._getType(input)

    if (parsedType !== 'date') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'date',
        received: ctx.parsedType,
      })
      return INVALID
    }

    if (isNaN(input.data.getTime())) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_date',
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
            code: 'too_small',
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
            code: 'too_big',
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: 'date',
          })
          status.dirty()
        }
      } else {
        utils.assert.assertNever(check)
      }
    }

    return {
      status: status.value,
      value: new Date((input.data as Date).getTime()),
    }
  }

  _addCheck(check: ZodDateCheck) {
    return new ZodDateImpl({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }

  min(minDate: Date, message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      value: minDate.getTime(),
      message: utils.errors.toString(message),
    })
  }

  max(maxDate: Date, message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'max',
      value: maxDate.getTime(),
      message: utils.errors.toString(message),
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

  isEqual(schema: ZodBaseTypeImpl): boolean {
    if (!(schema instanceof ZodDateImpl)) return false
    const thisChecks = new utils.ds.CustomSet<ZodDateCheck>(this._def.checks)
    const thatChecks = new utils.ds.CustomSet<ZodDateCheck>(schema._def.checks)
    return thisChecks.isEqual(thatChecks) && this._def.coerce === schema._def.coerce
  }
}
