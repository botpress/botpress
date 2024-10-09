import * as bp from '.botpress'

export type Handler<E extends keyof bp.BotEvents> = (
  props: bp.EventHandlerProps,
  event: bp.BotEvents[E]
) => Promise<void>
