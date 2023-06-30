/* eslint-disable no-console */
import { AsyncLocalStorage } from 'async_hooks'
import util from 'util'

const oldConsole = console

type LoggingContext = {
  botId: string
}

const getContext = () => {
  const ctx = asyncLocalStorage.getStore()
  if (!ctx) {
    throw new Error('no ctx')
  }

  return ctx
}

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
  oldConsole.log('overriding console')
  console = {
    ...oldConsole,
    ...newConsole,
  }
}

export const logger = {
  forBot: () => newConsole,
}

export const asyncLocalStorage = new AsyncLocalStorage<LoggingContext>()
