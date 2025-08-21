import type * as bp from '.botpress'

export type Supplier<T> = () => T

export type Result<T> = { success: true; data: T } | { success: false; error: Error }

export type CommonHandlerProps = {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
}

type ConfigurationTypes = bp.Context['configurationType']
export type ContextOfType<T extends ConfigurationTypes> = Extract<bp.Context, { configurationType: T }>
