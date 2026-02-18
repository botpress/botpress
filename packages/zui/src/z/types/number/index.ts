import { ZodIssueCode } from '../../error'
import * as utils from '../../utils'
import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseContext,
  ParseInput,
  ParseReturnType,
  ParseStatus,
} from '../index'

export type ZodNumberCheck =
  | { kind: 'min'; value: number; inclusive: boolean; message?: string }
  | { kind: 'max'; value: number; inclusive: boolean; message?: string }
  | { kind: 'int'; message?: string }
  | { kind: 'multipleOf'; value: number; message?: string }
  | { kind: 'finite'; message?: string }
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val: number, step: number) {
  const valDecCount = (val.toString().split('.')[1] || '').length
  const stepDecCount = (step.toString().split('.')[1] || '').length
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount
  const valInt = parseInt(val.toFixed(decCount).replace('.', ''))
  const stepInt = parseInt(step.toFixed(decCount).replace('.', ''))
  return (valInt % stepInt) / Math.pow(10, decCount)
}

export type ZodNumberDef = {
  checks: ZodNumberCheck[]
  typeName: 'ZodNumber'
  coerce: boolean
} & ZodTypeDef

export class ZodNumber extends ZodType<number, ZodNumberDef> {
  _parse(input: ParseInput): ParseReturnType<number> {
    if (this._def.coerce) {
      input.data = Number(input.data)
    }
    const parsedType = this._getType(input)
    if (parsedType !== 'number') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'number',
        received: ctx.parsedType,
      })
      return INVALID
    }

    let ctx: undefined | ParseContext = undefined
    const status = new ParseStatus()

    for (const check of this._def.checks) {
      if (check.kind === 'int') {
        if (!Number.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'invalid_type',
            expected: 'integer',
            received: 'float',
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'min') {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'too_small',
            minimum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            exact: false,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'max') {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'too_big',
            maximum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            exact: false,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'multipleOf') {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'not_multiple_of',
            multipleOf: check.value,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'finite') {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'not_finite',
            message: check.message,
          })
          status.dirty()
        }
      } else {
        utils.assert.assertNever(check)
      }
    }

    return { status: status.value, value: input.data }
  }

  static create = (params?: RawCreateParams & { coerce?: boolean }): ZodNumber => {
    return new ZodNumber({
      checks: [],
      typeName: 'ZodNumber',
      coerce: params?.coerce || false,
      ...processCreateParams(params),
    })
  }

  gte(value: number, message?: utils.errors.ErrMessage) {
    return this.setLimit('min', value, true, utils.errors.toString(message))
  }
  min = this.gte

  gt(value: number, message?: utils.errors.ErrMessage) {
    return this.setLimit('min', value, false, utils.errors.toString(message))
  }

  lte(value: number, message?: utils.errors.ErrMessage) {
    return this.setLimit('max', value, true, utils.errors.toString(message))
  }
  max = this.lte

  lt(value: number, message?: utils.errors.ErrMessage) {
    return this.setLimit('max', value, false, utils.errors.toString(message))
  }

  protected setLimit(kind: 'min' | 'max', value: number, inclusive: boolean, message?: string) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: utils.errors.toString(message),
        },
      ],
    })
  }

  _addCheck(check: ZodNumberCheck) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }

  int(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'int',
      message: utils.errors.toString(message),
    })
  }

  positive(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      value: 0,
      inclusive: false,
      message: utils.errors.toString(message),
    })
  }

  negative(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'max',
      value: 0,
      inclusive: false,
      message: utils.errors.toString(message),
    })
  }

  nonpositive(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'max',
      value: 0,
      inclusive: true,
      message: utils.errors.toString(message),
    })
  }

  nonnegative(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      value: 0,
      inclusive: true,
      message: utils.errors.toString(message),
    })
  }

  multipleOf(value: number, message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'multipleOf',
      value,
      message: utils.errors.toString(message),
    })
  }
  step = this.multipleOf

  finite(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'finite',
      message: utils.errors.toString(message),
    })
  }

  safe(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: utils.errors.toString(message),
    })._addCheck({
      kind: 'max',
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: utils.errors.toString(message),
    })
  }

  get minValue() {
    let min: number | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }
    return min
  }

  get maxValue() {
    let max: number | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return max
  }

  get isInt() {
    return !!this._def.checks.find(
      (ch) => ch.kind === 'int' || (ch.kind === 'multipleOf' && Number.isInteger(ch.value))
    )
  }

  get isFinite() {
    let max: number | null = null,
      min: number | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'finite' || ch.kind === 'int' || ch.kind === 'multipleOf') {
        return true
      } else if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      } else if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return Number.isFinite(min) && Number.isFinite(max)
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodNumber)) return false
    const thisChecks = new utils.ds.CustomSet<ZodNumberCheck>(this._def.checks)
    const thatChecks = new utils.ds.CustomSet<ZodNumberCheck>(schema._def.checks)
    return thisChecks.isEqual(thatChecks)
  }
}
