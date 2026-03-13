import { Action, z } from '@botpress/runtime'
import { ITEMS, resolveItemName, type ItemType } from '../lib/items'
import type { Player } from '../lib/types'

export const useItem = new Action({
  name: 'useItem',
  description: 'Use an inventory item during combat',

  input: z.object({
    gameId: z.string().describe('Active game ID'),
    discordUserId: z.string().describe('Discord user ID of the player'),
    itemName: z.string().describe('Item name or type to use'),
  }),

  output: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  async handler({ input }) {
    const { GamesTable } = await import('../tables/Games')
    const { PlayersTable } = await import('../tables/Players')

    // Find the game
    const { rows: gameRows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
    const game = gameRows[0]
    if (!game || game.phase !== 'combat') {
      return { success: false, message: 'No active combat to use items in.' }
    }

    // Find the player in game
    const player = game.players.find((p: Player) => p.discordUserId === input.discordUserId && p.alive)
    if (!player) {
      return { success: false, message: "You're not in this fight (or you're eliminated)." }
    }

    // Find player profile for inventory
    const { rows: profileRows } = await PlayersTable.findRows({
      filter: { discordUserId: input.discordUserId },
      limit: 1,
    })
    const profile = profileRows[0]
    if (!profile) {
      return { success: false, message: 'No player profile found. Use `!startGame` first.' }
    }

    // Resolve item name to type
    const itemType = resolveItemName(input.itemName)
    if (!itemType) {
      return { success: false, message: `Unknown item "${input.itemName}". Check \`!inventory\` for your items.` }
    }

    // Check inventory
    const invItem = profile.inventory.find((i: { type: string }) => i.type === itemType)
    if (!invItem || invItem.quantity <= 0) {
      const def = ITEMS[itemType]
      return { success: false, message: `You don't have any ${def.name}!` }
    }

    // Apply item effect
    const def = ITEMS[itemType]
    const players = [...game.players] as Player[]
    const gamePlayer = players.find((p) => p.discordUserId === input.discordUserId)!
    let effectText = ''

    switch (itemType as ItemType) {
      case 'hpPotion': {
        const healed = Math.min(20, gamePlayer.maxHp - gamePlayer.hp)
        gamePlayer.hp += healed
        effectText = `${def.emoji} Used **${def.name}**! Restored ${healed} HP. (${gamePlayer.hp}/${gamePlayer.maxHp})`
        break
      }
      case 'energyDrink': {
        const restored = Math.min(15, gamePlayer.maxEnergy - gamePlayer.energy)
        gamePlayer.energy += restored
        effectText = `${def.emoji} Used **${def.name}**! Restored ${restored} energy. (${gamePlayer.energy}/${gamePlayer.maxEnergy})`
        break
      }
      case 'shieldToken': {
        gamePlayer.statusEffects.push({ type: 'shielded', turnsLeft: 2, stacks: 25 })
        effectText = `${def.emoji} Used **${def.name}**! Absorbing up to 25 damage this round.`
        break
      }
      case 'damageBoost': {
        gamePlayer.statusEffects.push({ type: 'damageBoost', turnsLeft: 2, stacks: 10 })
        effectText = `${def.emoji} Used **${def.name}**! +10 damage on your next attack.`
        break
      }
      case 'mirrorShard': {
        gamePlayer.statusEffects.push({ type: 'decoy', turnsLeft: 2 })
        effectText = `${def.emoji} Used **${def.name}**! Reflecting the next incoming attack back to your attacker!`
        break
      }
      case 'quackGrenade': {
        const enemies = players.filter((p) => p.discordUserId !== input.discordUserId && p.alive)
        for (const enemy of enemies) {
          enemy.hp = Math.max(0, enemy.hp - 15)
          if (enemy.hp <= 0) {
            enemy.alive = false
          }
        }
        effectText = `${def.emoji} Used **${def.name}**! 💥 15 damage dealt to all enemies!`
        break
      }
      case 'breadcrumbMagnet': {
        // Non-combat item — persist boost flag on profile for next encounter
        profile.adventureState = { ...profile.adventureState, breadcrumbBoostActive: true }
        effectText = `${def.emoji} Used **${def.name}**! Breadcrumb rewards doubled on your next encounter.`
        break
      }
      case 'fogBomb': {
        gamePlayer.statusEffects.push({ type: 'dodgeAll', turnsLeft: 2 })
        effectText = `${def.emoji} Used **${def.name}**! 🌫️ A thick fog surrounds you — all attacks miss this round!`
        break
      }
      default:
        break
    }

    // Apply game effect first — if this fails, item is NOT consumed (safer for player)
    const inventory = [...profile.inventory]
    const idx = inventory.findIndex((i: { type: string }) => i.type === itemType)
    if (idx >= 0) {
      inventory[idx] = { ...inventory[idx]!, quantity: inventory[idx]!.quantity - 1 }
      if (inventory[idx]!.quantity <= 0) {
        inventory.splice(idx, 1)
      }
    }

    let gameUpdated = false
    try {
      await GamesTable.upsertRows({ rows: [{ ...game, players }], keyColumn: 'gameId' })
      gameUpdated = true
      await PlayersTable.upsertRows({ rows: [{ ...profile, inventory }], keyColumn: 'discordUserId' })
    } catch (e) {
      if (gameUpdated) {
        try {
          // Best-effort rollback to avoid granting a free item effect if inventory write fails.
          await GamesTable.upsertRows({ rows: [game], keyColumn: 'gameId' })
        } catch (rollbackError) {
          console.error('[useItem] Failed to rollback game state after inventory write failure', {
            gameId: input.gameId,
            userId: input.discordUserId,
            itemType,
            rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          })
        }
      }
      console.error('[useItem] Failed to persist item usage', {
        gameId: input.gameId,
        userId: input.discordUserId,
        itemType,
        error: e instanceof Error ? e.message : String(e),
      })
      return { success: false, message: '*The item fizzes and sputters.* Something went wrong — try again.' }
    }

    return { success: true, message: effectText }
  },
})
