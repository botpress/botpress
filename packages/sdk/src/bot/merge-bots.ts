import * as utils from '../utils'
import { BotLike } from './server'

export const mergeBots = (dest: BotLike<any>, src: BotLike<any>) => {
  for (const [type, actionHandler] of Object.entries(src.actionHandlers)) {
    dest.actionHandlers[type] = actionHandler
  }

  for (const [type, handlers] of Object.entries(src.eventHandlers)) {
    if (!handlers) {
      continue
    }
    dest.eventHandlers[type] = utils.arrays.safePush(dest.eventHandlers[type], ...handlers)
  }

  for (const [type, handlers] of Object.entries(src.messageHandlers)) {
    if (!handlers) {
      continue
    }
    dest.messageHandlers[type] = utils.arrays.safePush(dest.messageHandlers[type], ...handlers)
  }

  for (const [type, handlers] of Object.entries(src.stateExpiredHandlers)) {
    if (!handlers) {
      continue
    }
    // TODO: address this type issue
    // @ts-ignore
    dest.stateExpiredHandlers[type] = utils.arrays.safePush(dest.stateExpiredHandlers[type], ...handlers)
  }

  for (const [hook, types] of Object.entries(src.hookHandlers)) {
    for (const [type, handlers] of Object.entries(types)) {
      if (!handlers) {
        continue
      }
      // TODO: address this type issue
      // @ts-ignore
      dest.hookHandlers[hook]![type] = utils.arrays.safePush(dest.hookHandlers[hook]![type], ...handlers)
    }
  }
}
