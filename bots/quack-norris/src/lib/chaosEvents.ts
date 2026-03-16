import { addStatusEffect } from './combat'
import type { CombatEvent, Player } from './types'

export type ChaosEvent = {
  name: string
  emoji: string
  description: string
  apply: (players: Player[]) => CombatEvent[]
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

const CHAOS_EVENTS: ChaosEvent[] = [
  {
    name: 'Quack Storm',
    emoji: '🌪️',
    description:
      'The sky splits open and a furious vortex of breadcrumbs and feathers descends upon the arena! All fighters are battered for 8 damage as the storm rages!',
    apply: (players) => {
      const events: CombatEvent[] = []
      for (const p of players.filter((p) => p.alive)) {
        p.hp = Math.max(0, p.hp - 8)
        events.push({ text: `${p.name} is battered by the Quack Storm! -8 HP!`, type: 'chaos' })
      }
      return events
    },
  },
  {
    name: 'Energy Surge',
    emoji: '⚡',
    description:
      'The Pond Eternal pulses with primordial energy! The Great Mallard stirs in their cosmic slumber, and raw power floods every fighter with +20% of their max energy!',
    apply: (players) => {
      const events: CombatEvent[] = []
      for (const p of players.filter((p) => p.alive)) {
        const gain = Math.round(p.maxEnergy * 0.2)
        p.energy = Math.min(p.maxEnergy, p.energy + gain)
        events.push({ text: `${p.name} surges with energy! +${gain} energy!`, type: 'chaos' })
      }
      return events
    },
  },
  {
    name: 'Fog of War',
    emoji: '🌫️',
    description:
      'A thick, unnatural fog rolls in from the edges of the Quackverse. Sir David Attenbird squints through his monocle but sees nothing. All actions this round are hidden — and attacks have a 10% chance to miss!',
    apply: () => {
      return [
        {
          text: 'The fog descends like a wet blanket over the arena... actions are shrouded in mystery, and attacks may miss!',
          type: 'chaos',
        },
      ]
    },
  },
  {
    name: 'Rubber Duck Rain',
    emoji: '🦆',
    description:
      'The heavens open and a deluge of rubber ducks rains upon the arena! One lucky fighter is bonked on the head by a golden rubber duck and receives +20 HP!',
    apply: (players) => {
      const alive = players.filter((p) => p.alive)
      if (alive.length === 0) {
        return []
      }
      const lucky = pick(alive)
      lucky.hp = Math.min(lucky.maxHp, lucky.hp + 20)
      return [
        {
          text: `A golden rubber duck bonks ${lucky.name} on the head! +20 HP! The Great Mallard provides!`,
          type: 'chaos',
        },
      ]
    },
  },
  {
    name: 'The Floor Is Lava',
    emoji: '🌋',
    description:
      'Lake Quackatoa has breached the arena floor! Molten breadcrumbs bubble up through the cracks! Any fighter who rests this round will take 15 damage!',
    apply: () => {
      return [
        {
          text: "The arena floor ERUPTS with molten breadcrumbs! Don't stand still! (Resting players take 15 dmg!)",
          type: 'chaos',
        },
      ]
    },
  },
  {
    name: 'Chuck Norris Appears',
    emoji: '🥋',
    description:
      'Chuck Norris descends from his golden nest! He surveys the battlefield, spots the underdog, and places a wing on their shoulder. "Rise." The blessed fighter gains +30% damage for 2 rounds!',
    apply: (players) => {
      const alive = players.filter((p) => p.alive)
      if (alive.length === 0) {
        return []
      }
      const underdog = alive.reduce((min, p) => (p.hp < min.hp ? p : min), alive[0]!)
      addStatusEffect(underdog, { type: 'blessed', turnsLeft: 2 })
      return [
        {
          text: `Chuck Norris descends from his golden nest and places a wing on ${underdog.name}'s shoulder. "Rise." 🥋 +30% dmg for 2 rounds!`,
          type: 'chaos',
        },
      ]
    },
  },
  {
    name: 'Scrambled Orders',
    emoji: '🔀',
    description:
      'The Quackverse hiccups! Reality glitches like a bad dream! All attack targets are randomly reassigned — your wing swings where fate decides!',
    apply: () => {
      return [
        {
          text: 'The fabric of reality GLITCHES! All targets this round are SCRAMBLED! Fate chooses your victims!',
          type: 'chaos',
        },
      ]
    },
  },
  {
    name: 'Treasure Chest',
    emoji: '🎁',
    description:
      'A golden treasure chest materializes in the center of the arena, humming with ancient bread magic! The first fighter to use a light attack claims its contents: +15 HP!',
    apply: () => {
      return [
        {
          text: 'A golden treasure chest materializes in the center! First light attacker claims the prize! (+15 HP)',
          type: 'chaos',
        },
      ]
    },
  },
]

export const rollChaosEvent = (): ChaosEvent => {
  return pick(CHAOS_EVENTS)
}

export const getChaosEventByName = (name: string): ChaosEvent | undefined => {
  return CHAOS_EVENTS.find((e) => e.name === name)
}

// Random chaos trigger: 20% base + 10% per round after round 2, capped at 80%
export const shouldTriggerChaos = (round: number): boolean => {
  if (round < 2) {
    return false
  }
  const probability = Math.min(0.8, 0.2 + (round - 2) * 0.1)
  return Math.random() < probability
}

export const formatChaosAnnouncement = (event: ChaosEvent): string => {
  return `\n${event.emoji} **CHAOS EVENT: ${event.name}!** ${event.emoji}\n${event.description}\n`
}

// Special handling for events that modify round resolution
export const isFogOfWar = (event: ChaosEvent): boolean => event.name === 'Fog of War'
export const isFloorIsLava = (event: ChaosEvent): boolean => event.name === 'The Floor Is Lava'
export const isScrambledOrders = (event: ChaosEvent): boolean => event.name === 'Scrambled Orders'
export const isTreasureChest = (event: ChaosEvent): boolean => event.name === 'Treasure Chest'

// Fog of War: 10% miss chance on attacks
export const fogMissChance = (): boolean => Math.random() < 0.1

export const applyFloorIsLava = (restingPlayers: Player[]): CombatEvent[] => {
  const events: CombatEvent[] = []
  for (const p of restingPlayers) {
    p.hp = Math.max(0, p.hp - 15)
    events.push({ text: `${p.name} rests on LAVA! -15 HP! Bad choice!`, type: 'chaos' })
  }
  return events
}

export const scrambleTargets = (
  playerActions: { discordUserId: string; targetUserId?: string }[],
  alivePlayers: Player[]
): void => {
  const aliveIds = alivePlayers.map((p) => p.discordUserId)
  for (const action of playerActions) {
    if (action.targetUserId) {
      const otherIds = aliveIds.filter((id) => id !== action.discordUserId)
      if (otherIds.length > 0) {
        action.targetUserId = pick(otherIds)
      }
    }
  }
}

export const applyTreasureChest = (firstLightAttacker: Player | undefined): CombatEvent[] => {
  if (!firstLightAttacker) {
    return [
      { text: 'Nobody used a light attack! The treasure chest vanishes in a puff of breadcrumbs!', type: 'chaos' },
    ]
  }
  firstLightAttacker.hp = Math.min(firstLightAttacker.maxHp, firstLightAttacker.hp + 15)
  return [{ text: `${firstLightAttacker.name} claims the treasure chest! +15 HP! The spoils of speed!`, type: 'chaos' }]
}
