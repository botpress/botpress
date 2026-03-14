import type { CommandHandler } from '../lib/command-context'
import { adventureCommands } from './adventure'
import { bountyCommands } from './bounty'
import { combatCommands } from './combat'
import { infoCommands } from './info'
import { questCommands } from './quest'
import { shopCommands } from './shop'

// Build registry with lowercase keys for case-insensitive lookup
const rawCommands = new Map<string, CommandHandler>([
  ...adventureCommands,
  ...bountyCommands,
  ...questCommands,
  ...shopCommands,
  ...combatCommands,
  ...infoCommands,
])

export const commandRegistry = new Map<string, CommandHandler>()
for (const [key, handler] of rawCommands) {
  commandRegistry.set(key.toLowerCase(), handler)
}

export { handleEncounterChoice, handleTravelChoice } from './adventure'
export { handleQuestChoice, handleQuestAccept } from './quest'
export { handleShopBuy } from './shop'
