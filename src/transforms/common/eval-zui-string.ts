import z, { ZodTypeAny } from '../../z'

export class InvalidZuiStringError extends Error {
  public constructor(public readonly zuiString: string) {
    super(`String "${zuiString}" does not evaluate to a Zod type`)
  }
}

export const evalZuiString = (zuiString: string): ZodTypeAny => {
  const result = new Function('z', `return ${zuiString}`)(z)
  if (!(result instanceof z.ZodType)) {
    throw new InvalidZuiStringError(zuiString)
  }
  return result
}
