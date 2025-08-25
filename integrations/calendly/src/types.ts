import type * as bp from '.botpress'

export type Result<T> = { success: true; data: T } | { success: false; error: Error }

export type CommonHandlerProps = {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}
