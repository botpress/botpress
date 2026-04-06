import * as z from '../../z'

export type EvalZuiStringResult =
  | {
      sucess: true
      value: z.ZodTypeAny
    }
  | {
      sucess: false
      error: string
    }

export const evalZuiString = (zuiString: string): EvalZuiStringResult => {
  let result: unknown

  try {
    result = new Function('z', `return ${zuiString}`)(z)
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { sucess: false, error: `Failed to evaluate schema: ${err.message}` }
  }

  if (!z.is.zuiType(result)) {
    return { sucess: false, error: `String "${zuiString}" does not evaluate to a Zod schema` }
  }

  return {
    sucess: true,
    value: result,
  }
}
