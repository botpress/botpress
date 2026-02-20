import * as utils from '../../utils'
import {
  addIssueToContext,
  INVALID,
  ParseContext,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
} from '../basetype'

export type ZodBigIntCheck =
  | { kind: 'min'; value: bigint; inclusive: boolean; message?: string }
  | { kind: 'max'; value: bigint; inclusive: boolean; message?: string }
  | { kind: 'multipleOf'; value: bigint; message?: string }

export type ZodBigIntDef = {
  checks: ZodBigIntCheck[]
  typeName: 'ZodBigInt'
  coerce: boolean
} & ZodTypeDef

export class ZodBigInt extends ZodType<bigint, ZodBigIntDef> {
  _parse(input: ParseInput): ParseReturnType<bigint> {
    if (this._def.coerce) {
      input.data = BigInt(input.data)
    }
    const parsedType = this._getType(input)
    if (parsedType !== 'bigint') {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'bigint',
        received: ctx.parsedType,
      })
      return INVALID
    }

    let ctx: undefined | ParseContext = undefined
    const status = new ParseStatus()

    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'too_small',
            type: 'bigint',
            minimum: check.value,
            inclusive: check.inclusive,
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
            type: 'bigint',
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'multipleOf') {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: 'not_multiple_of',
            multipleOf: check.value,
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

  static create = (params?: RawCreateParams & { coerce?: boolean }): ZodBigInt => {
    return new ZodBigInt({
      checks: [],
      typeName: 'ZodBigInt',
      coerce: params?.coerce ?? false,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodBigInt)) {
      return false
    }
    if (this._def.coerce !== schema._def.coerce) return false

    const thisChecks = new utils.ds.CustomSet<ZodBigIntCheck>(this._def.checks)
    const thatChecks = new utils.ds.CustomSet<ZodBigIntCheck>(schema._def.checks)

    return thisChecks.isEqual(thatChecks)
  }

  gte(value: bigint, message?: utils.errors.ErrMessage) {
    return this.setLimit('min', value, true, utils.errors.toString(message))
  }
  min = this.gte

  gt(value: bigint, message?: utils.errors.ErrMessage) {
    return this.setLimit('min', value, false, utils.errors.toString(message))
  }

  lte(value: bigint, message?: utils.errors.ErrMessage) {
    return this.setLimit('max', value, true, utils.errors.toString(message))
  }
  max = this.lte

  lt(value: bigint, message?: utils.errors.ErrMessage) {
    return this.setLimit('max', value, false, utils.errors.toString(message))
  }

  protected setLimit(kind: 'min' | 'max', value: bigint, inclusive: boolean, message?: string) {
    return new ZodBigInt({
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

  _addCheck(check: ZodBigIntCheck) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }

  positive(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      value: BigInt(0),
      inclusive: false,
      message: utils.errors.toString(message),
    })
  }

  negative(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'max',
      value: BigInt(0),
      inclusive: false,
      message: utils.errors.toString(message),
    })
  }

  nonpositive(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'max',
      value: BigInt(0),
      inclusive: true,
      message: utils.errors.toString(message),
    })
  }

  nonnegative(message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'min',
      value: BigInt(0),
      inclusive: true,
      message: utils.errors.toString(message),
    })
  }

  multipleOf(value: bigint, message?: utils.errors.ErrMessage) {
    return this._addCheck({
      kind: 'multipleOf',
      value,
      message: utils.errors.toString(message),
    })
  }

  get minValue() {
    let min: bigint | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }
    return min
  }

  get maxValue() {
    let max: bigint | null = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return max
  }
}
