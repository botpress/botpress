import { EventHandlerProps, BotConfiguration } from '../bot'

export const getBotConfig = ({ ctx }: { ctx: EventHandlerProps['ctx'] }): BotConfiguration =>
  JSON.parse(ctx.configuration.payload)
