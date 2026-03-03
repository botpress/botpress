import { is } from '../../guards'
import { builders as z } from '../../internal-builders'
import type { ZodTypeAny } from '../../typings'

export type EvalZuiStringResult =
  | {
      sucess: true
      value: ZodTypeAny
    }
  | {
      sucess: false
      error: string
    }

export const evalZuiString = (zuiString: string): EvalZuiStringResult => {
  let result: any

  const zWithCoerce = Object.assign({}, z, {
    coerce: {
      string: (arg?: any) => z.string({ ...arg, coerce: true }),
      number: (arg?: any) => z.number({ ...arg, coerce: true }),
      boolean: (arg?: any) => z.boolean({ ...arg, coerce: true }),
      bigint: (arg?: any) => z.bigint({ ...arg, coerce: true }),
      date: (arg?: any) => z.date({ ...arg, coerce: true }),
    },
  })

  try {
    result = new Function('z', `return ${zuiString}`)(zWithCoerce)
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { sucess: false, error: `Failed to evaluate schema: ${err.message}` }
  }

  if (!is.zuiType(result)) {
    return { sucess: false, error: `String "${zuiString}" does not evaluate to a Zod schema` }
  }

  return {
    sucess: true,
    value: result,
  }
}
