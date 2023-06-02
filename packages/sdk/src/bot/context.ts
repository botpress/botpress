import { z } from 'zod'

export const botOperationSchema = z.enum(['event_received', 'register', 'unregister', 'ping'])

export type BotOperation = z.infer<typeof botOperationSchema>

export type BotContext<Configuration = any, Type extends string = string> = {
  botId: string
  type: Type
  operation: BotOperation
  configuration: Configuration
}
