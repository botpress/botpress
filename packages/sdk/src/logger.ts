/* eslint-disable no-console */
import { AsyncLocalStorage } from 'async_hooks'
import util from 'util'
import { BotContext } from './bot'
import { IntegrationContext } from './integration'

const oldConsole = console

// We only extract the fields we need from the context.
// We don't want to extract other fields as they can be calculated from the Bridge and API databases
type PartialBotContext = Pick<BotContext, 'operation' | 'type'>
type PartialIntegrationContext = Pick<IntegrationContext, 'operation' | 'botId'> & { availableToBotOwner?: boolean }

type LoggingContext = PartialBotContext | PartialIntegrationContext

const getContext = () => {
  const ctx = asyncLocalStorage.getStore()
  if (!ctx) {
    throw new Error('no ctx')
  }

  return ctx
}

const isIntegrationContext = (ctx: LoggingContext): ctx is PartialIntegrationContext => 'botId' in ctx

const serializeMessage = (args: Parameters<typeof util.format>, ctx: LoggingContext) =>
  JSON.stringify({ msg: util.format(...args), ctx })

const callOldConsole = (method: 'log' | 'info' | 'debug' | 'error' | 'warn', args: Parameters<typeof util.format>) => {
  const ctx = getContext()
  const msg = serializeMessage(args, ctx)

  oldConsole[method](msg)
}

const newConsole = {
  log: (...args: Parameters<typeof console.log>) => {
    callOldConsole('log', args)
  },
  info: (...args: Parameters<typeof console.info>) => {
    callOldConsole('info', args)
  },
  warn: (...args: Parameters<typeof console.warn>) => {
    callOldConsole('warn', args)
  },
  error: (...args: Parameters<typeof console.error>) => {
    callOldConsole('error', args)
  },
  debug: (...args: Parameters<typeof console.debug>) => {
    callOldConsole('debug', args)
  },
}

/**
 * Override console methods to send custom-formatted messages to stdout
 */
export const overrideConsole = () => {
  console = {
    ...oldConsole,
    ...newConsole,
  }
}

export const logger = {
  forBot: () => {
    const ctx = getContext()
    if (isIntegrationContext(ctx)) {
      ctx.availableToBotOwner = true
    }
    return newConsole
  },
}

export const asyncLocalStorage = new AsyncLocalStorage<LoggingContext>()
