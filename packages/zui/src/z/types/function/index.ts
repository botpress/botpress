import { defaultErrorMap, getErrorMap, ZodError, ZodErrorMap, ZodIssue } from '../../error'
import * as utils from '../../utils'
import {
  RawCreateParams,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  addIssueToContext,
  INVALID,
  makeIssue,
  OK,
  ParseInput,
  ParseReturnType,
} from '../basetype'

import {
  //
  ZodPromise,
  ZodTuple,
  ZodUnknown,
  AnyZodTuple,
} from '../index' // TODO(circle): adress circular dependency

export type ZodFunctionDef<Args extends ZodTuple<any, any> = ZodTuple, Returns extends ZodType = ZodType> = {
  args: Args
  returns: Returns
  typeName: 'ZodFunction'
} & ZodTypeDef

export type OuterTypeOfFunction<Args extends ZodTuple<any, any>, Returns extends ZodType> =
  Args['_input'] extends Array<any> ? (...args: Args['_input']) => Returns['_output'] : never

export type InnerTypeOfFunction<Args extends ZodTuple<any, any>, Returns extends ZodType> =
  Args['_output'] extends Array<any> ? (...args: Args['_output']) => Returns['_input'] : never

export class ZodFunction<Args extends ZodTuple<any, any> = ZodTuple, Returns extends ZodType = ZodType> extends ZodType<
  OuterTypeOfFunction<Args, Returns>,
  ZodFunctionDef<Args, Returns>,
  InnerTypeOfFunction<Args, Returns>
> {
  dereference(defs: Record<string, ZodType>): ZodType {
    const args = this._def.args.dereference(defs) as ZodTuple<[], ZodUnknown>
    const returns = this._def.returns.dereference(defs)
    return new ZodFunction({
      ...this._def,
      args,
      returns,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([...this._def.args.getReferences(), ...this._def.returns.getReferences()])
  }

  clone(): ZodFunction<Args, Returns> {
    return new ZodFunction({
      ...this._def,
      args: this._def.args.clone() as ZodTuple<any, any>,
      returns: this._def.returns.clone(),
    }) as ZodFunction<Args, Returns>
  }

  _parse(input: ParseInput): ParseReturnType<any> {
    const { ctx } = this._processInputParams(input)
    if (ctx.parsedType !== 'function') {
      addIssueToContext(ctx, {
        code: 'invalid_type',
        expected: 'function',
        received: ctx.parsedType,
      })
      return INVALID
    }

    function makeArgsIssue(args: any, error: ZodError): ZodIssue {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), defaultErrorMap].filter(
          (x) => !!x
        ) as ZodErrorMap[],
        issueData: {
          code: 'invalid_arguments',
          argumentsError: error,
        },
      })
    }

    function makeReturnsIssue(returns: any, error: ZodError): ZodIssue {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), defaultErrorMap].filter(
          (x) => !!x
        ) as ZodErrorMap[],
        issueData: {
          code: 'invalid_return_type',
          returnTypeError: error,
        },
      })
    }

    const params = { errorMap: ctx.common.contextualErrorMap }
    const fn = ctx.data

    if (this._def.returns instanceof ZodPromise) {
      // Would love a way to avoid disabling this rule, but we need
      // an alias (using an arrow function was what caused 2651).

      const me = this
      return OK(async function (this: any, ...args: any[]) {
        const error = new ZodError([])
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e))
          throw error
        })
        const result = await Reflect.apply(fn, this, parsedArgs)
        const parsedReturns = await (me._def.returns as unknown as ZodPromise<ZodType>)._def.type
          .parseAsync(result, params)
          .catch((e: any) => {
            // TODO: type e properly
            error.addIssue(makeReturnsIssue(result, e))
            throw error
          })
        return parsedReturns
      })
    } else {
      // Would love a way to avoid disabling this rule, but we need
      // an alias (using an arrow function was what caused 2651).

      const me = this
      return OK(function (this: any, ...args: any[]) {
        const parsedArgs = me._def.args.safeParse(args, params)
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)])
        }
        const result = Reflect.apply(fn, this, parsedArgs.data)
        const parsedReturns = me._def.returns.safeParse(result, params)
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)])
        }
        return parsedReturns.data
      })
    }
  }

  parameters() {
    return this._def.args
  }

  returnType() {
    return this._def.returns
  }

  args<Items extends Parameters<(typeof ZodTuple)['create']>[0]>(
    ...items: Items
  ): ZodFunction<ZodTuple<Items, ZodUnknown>, Returns> {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create()),
    })
  }

  returns<NewReturnType extends ZodType<any, any>>(returnType: NewReturnType): ZodFunction<Args, NewReturnType> {
    return new ZodFunction({
      ...this._def,
      returns: returnType,
    })
  }

  implement<F extends InnerTypeOfFunction<Args, Returns>>(
    func: F
  ): ReturnType<F> extends Returns['_output']
    ? (...args: Args['_input']) => ReturnType<F>
    : OuterTypeOfFunction<Args, Returns> {
    const validatedFunc = this.parse(func)
    return validatedFunc
  }

  strictImplement(func: InnerTypeOfFunction<Args, Returns>): InnerTypeOfFunction<Args, Returns> {
    const validatedFunc = this.parse(func)
    return validatedFunc
  }

  validate = this.implement

  static create(): ZodFunction<ZodTuple<[], ZodUnknown>, ZodUnknown>
  static create<T extends AnyZodTuple = ZodTuple<[], ZodUnknown>>(args: T): ZodFunction<T, ZodUnknown>
  static create<T extends AnyZodTuple, U extends ZodType>(args: T, returns: U): ZodFunction<T, U>
  static create<T extends AnyZodTuple = ZodTuple<[], ZodUnknown>, U extends ZodType = ZodUnknown>(
    args: T,
    returns: U,
    params?: RawCreateParams
  ): ZodFunction<T, U>
  static create(args?: AnyZodTuple, returns?: ZodType, params?: RawCreateParams) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: 'ZodFunction',
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    return (
      schema instanceof ZodFunction &&
      this._def.args.isEqual(schema._def.args) &&
      this._def.returns.isEqual(schema._def.returns)
    )
  }
}
