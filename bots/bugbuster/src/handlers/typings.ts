import { EventHandlerProps, BotEvents } from '../bot'

export type Handler<E extends keyof BotEvents> = (props: EventHandlerProps, event: BotEvents[E]) => Promise<void>
