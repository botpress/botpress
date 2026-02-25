import type { IZodTuple, IZodType, ZodTupleDef } from '../../typings'
import * as utils from '../../utils'
import {
  ParseInputLazyPath,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  SyncParseReturnType,
  ZodBaseTypeImpl,
} from '../basetype'

export type ZodTupleItems = [IZodType, ...IZodType[]]

type _AssertArray<T> = T extends any[] ? T : never
type _OutputTypeOfTuple<T extends ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends IZodType<any, any> ? T[k]['_output'] : never
}>

type _OutputTypeOfTupleWithRest<
  T extends ZodTupleItems | [],
  Rest extends IZodType | null = null,
> = Rest extends IZodType ? [..._OutputTypeOfTuple<T>, ...Rest['_output'][]] : _OutputTypeOfTuple<T>

type _InputTypeOfTuple<T extends ZodTupleItems | []> = _AssertArray<{
  [k in keyof T]: T[k] extends IZodType<any, any> ? T[k]['_input'] : never
}>

type _InputTypeOfTupleWithRest<
  T extends ZodTupleItems | [],
  Rest extends IZodType | null = null,
> = Rest extends IZodType ? [..._InputTypeOfTuple<T>, ...Rest['_input'][]] : _InputTypeOfTuple<T>

/**
 * @deprecated use ZodTuple instead
 */
export type AnyZodTuple = IZodTuple<[IZodType, ...IZodType[]] | [], IZodType | null>

export class ZodTupleImpl<
    T extends [IZodType, ...IZodType[]] | [] = [IZodType, ...IZodType[]],
    Rest extends IZodType | null = null,
  >
  extends ZodBaseTypeImpl<_OutputTypeOfTupleWithRest<T, Rest>, ZodTupleDef<T, Rest>, _InputTypeOfTupleWithRest<T, Rest>>
  implements IZodTuple<T, Rest>
{
  dereference(defs: Record<string, IZodType>): IZodType {
    const items = this._def.items.map((item) => item.dereference(defs)) as [IZodType, ...IZodType[]]
    const rest = this._def.rest ? this._def.rest.dereference(defs) : null
    return new ZodTupleImpl({
      ...this._def,
      items,
      rest,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([
      ...this._def.items.flatMap((item) => item.getReferences()),
      ...(this._def.rest ? this._def.rest.getReferences() : []),
    ])
  }

  clone(): IZodTuple<T, Rest> {
    const items = this._def.items.map((item) => item.clone()) as [IZodType, ...IZodType[]]
    const rest = this._def.rest ? this._def.rest.clone() : null
    return new ZodTupleImpl({
      ...this._def,
      items: items as T,
      rest: rest as Rest,
    })
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== 'array') {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'array',
        received: ctx.parsedType,
      })
      return INVALID
    }

    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: 'too_small',
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: 'array',
      })

      return INVALID
    }

    const rest = this._def.rest

    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: 'too_big',
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: 'array',
      })
      status.dirty()
    }

    const items = [...ctx.data]
      .map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest
        if (!schema) return null
        return ZodBaseTypeImpl.fromInterface(schema)._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex))
      })
      .filter((x) => !!x) // filter nulls

    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results)
      })
    } else {
      return ParseStatus.mergeArray(status, items as SyncParseReturnType<any>[])
    }
  }

  get items() {
    return this._def.items
  }

  rest<Rest extends IZodType>(rest: Rest): IZodTuple<T, Rest> {
    return new ZodTupleImpl({
      ...this._def,
      rest,
    })
  }

  isEqual(schema: IZodType): boolean {
    if (!(schema instanceof ZodTupleImpl)) return false
    if (!this._restEquals(schema)) return false

    const compare = (a: IZodType, b: IZodType) => a.isEqual(b)
    const thisItems = new utils.ds.CustomSet<IZodType>(this._def.items, { compare })
    const schemaItems = new utils.ds.CustomSet<IZodType>(schema._def.items, { compare })
    return thisItems.isEqual(schemaItems)
  }

  private _restEquals(schema: ZodTupleImpl) {
    if (this._def.rest === null) {
      return schema._def.rest === null
    }
    return schema._def.rest !== null && this._def.rest.isEqual(schema._def.rest)
  }
}
