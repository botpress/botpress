import type { IZodIntersection, IZodBaseType, ZodIntersectionDef } from '../../typings'
import * as utils from '../../utils'
import {
  getParsedType,
  addIssueToContext,
  INVALID,
  isAborted,
  isDirty,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
  ZodBaseTypeImpl,
} from '../basetype'

export type { ZodIntersectionDef }

export class ZodIntersectionImpl<T extends IZodBaseType = IZodBaseType, U extends IZodBaseType = IZodBaseType>
  extends ZodBaseTypeImpl<T['_output'] & U['_output'], ZodIntersectionDef<T, U>, T['_input'] & U['_input']>
  implements IZodIntersection<T, U>
{
  dereference(defs: Record<string, IZodBaseType>): IZodBaseType {
    return new ZodIntersectionImpl({
      ...this._def,
      left: this._def.left.dereference(defs),
      right: this._def.right.dereference(defs),
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([...this._def.left.getReferences(), ...this._def.right.getReferences()])
  }

  clone(): IZodIntersection<T, U> {
    return new ZodIntersectionImpl({
      ...this._def,
      left: this._def.left.clone() as T,
      right: this._def.right.clone() as U,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    const handleParsed = (
      parsedLeft: SyncParseReturnType<any>,
      parsedRight: SyncParseReturnType<any>
    ): SyncParseReturnType<T & U> => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID
      }

      const merged = this._mergeValues(parsedLeft.value, parsedRight.value)

      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: 'invalid_intersection_types',
        })
        return INVALID
      }

      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty()
      }

      return { status: status.value, value: merged.data }
    }

    if (ctx.common.async) {
      return Promise.all([
        ZodBaseTypeImpl.fromInterface(this._def.left)._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        ZodBaseTypeImpl.fromInterface(this._def.right)._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      ]).then(([left, right]: any) => handleParsed(left, right))
    } else {
      return handleParsed(
        ZodBaseTypeImpl.fromInterface(this._def.left)._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        ZodBaseTypeImpl.fromInterface(this._def.right)._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
      )
    }
  }

  isEqual(schema: IZodBaseType): boolean {
    if (!(schema instanceof ZodIntersectionImpl)) return false

    const compare = (a: IZodBaseType, b: IZodBaseType) => a.isEqual(b)
    const thisItems = new utils.ds.CustomSet<IZodBaseType>([this._def.left, this._def.right], { compare })
    const thatItems = new utils.ds.CustomSet<IZodBaseType>([schema._def.left, schema._def.right], { compare })
    return thisItems.isEqual(thatItems)
  }

  private _mergeValues(a: any, b: any): { valid: true; data: any } | { valid: false } {
    const aType = getParsedType(a)
    const bType = getParsedType(b)

    if (a === b) {
      return { valid: true, data: a }
    } else if (aType === 'object' && bType === 'object') {
      const bKeys = Object.keys(b)
      const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1)

      const newObj: any = { ...a, ...b }
      for (const key of sharedKeys) {
        const sharedValue = this._mergeValues(a[key], b[key])
        if (!sharedValue.valid) {
          return { valid: false }
        }
        newObj[key] = sharedValue.data
      }

      return { valid: true, data: newObj }
    } else if (aType === 'array' && bType === 'array') {
      if (a.length !== b.length) {
        return { valid: false }
      }

      const newArray: unknown[] = []
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index]
        const itemB = b[index]
        const sharedValue = this._mergeValues(itemA, itemB)

        if (!sharedValue.valid) {
          return { valid: false }
        }

        newArray.push(sharedValue.data)
      }

      return { valid: true, data: newArray }
    } else if (aType === 'date' && bType === 'date' && +a === +b) {
      return { valid: true, data: a }
    } else {
      return { valid: false }
    }
  }
}
