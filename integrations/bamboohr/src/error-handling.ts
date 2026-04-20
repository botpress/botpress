import { RuntimeError } from '@botpress/client'

export class BambooHRRuntimeError extends RuntimeError {
  public static from(thrown: unknown, ctx: string): BambooHRRuntimeError {
    const errMessage = thrown instanceof Error ? thrown.message : String(thrown)
    return new BambooHRRuntimeError(`${ctx}: ${errMessage}`)
  }
}
