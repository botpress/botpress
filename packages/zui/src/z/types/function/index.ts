import { defaultErrorMap, getErrorMap, ZodError } from '../../error'
import type {
  IZodType,
  IZodFunction,
  ZodFunctionDef,
  IZodTuple,
  ZodErrorMap,
  ZodIssue,
  OuterTypeOfFunction,
  InnerTypeOfFunction,
  IZodUnknown,
  IZodPromise,
} from '../../typings'

import * as utils from '../../utils'

import { ZodBaseTypeImpl, addIssueToContext, INVALID, makeIssue, OK, ParseInput, ParseReturnType } from '../basetype'
import type { ZodNativeType } from '../../native'

import { builders } from '../../internal-builders'

export class ZodFunctionImpl<Args extends IZodTuple<any, any> = IZodTuple, Returns extends IZodType = IZodType>
  extends ZodBaseTypeImpl<
    OuterTypeOfFunction<Args, Returns>,
    ZodFunctionDef<Args, Returns>,
    InnerTypeOfFunction<Args, Returns>
  >
  implements IZodFunction<Args, Returns>
{
  dereference(defs: Record<string, IZodType>): IZodType {
    const args = this._def.args.dereference(defs) as IZodTuple<[], IZodUnknown>
    const returns = this._def.returns.dereference(defs)
    return new ZodFunctionImpl({
      ...this._def,
      args,
      returns,
    })
  }

  getReferences(): string[] {
    return utils.fn.unique([...this._def.args.getReferences(), ...this._def.returns.getReferences()])
  }

  clone(): IZodFunction<Args, Returns> {
    return new ZodFunctionImpl({
      ...this._def,
      args: this._def.args.clone() as Args,
      returns: this._def.returns.clone() as Returns,
    })
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

    const returns = this._def.returns as ZodNativeType
    if (returns.typeName === 'ZodPromise') {
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
        const parsedReturns = await (me._def.returns as unknown as IZodPromise<IZodType>)._def.type
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

  args<Items extends [IZodType, ...IZodType[]] | []>(
    ...items: Items
  ): IZodFunction<IZodTuple<Items, IZodUnknown>, Returns> {
    return new ZodFunctionImpl({
      ...this._def,
      args: builders.tuple(items).rest(builders.unknown()),
    }) as IZodFunction<IZodTuple<Items, IZodUnknown>, Returns>
  }

  returns<NewReturnType extends IZodType<any, any>>(returnType: NewReturnType): IZodFunction<Args, NewReturnType> {
    return new ZodFunctionImpl({
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

  isEqual(schema: IZodType): boolean {
    return (
      schema instanceof ZodFunctionImpl &&
      this._def.args.isEqual(schema._def.args) &&
      this._def.returns.isEqual(schema._def.returns)
    )
  }
}
