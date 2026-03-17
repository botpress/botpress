export type LocationId =
  | 'coliseum'
  | 'puddle'
  | 'highway'
  | 'quackatoa'
  | 'parkBench'
  | 'frozenPond'
  | 'breadcrumbVault'
  | 'greatNest'

export type LocationDefinition = {
  id: LocationId
  name: string
  emoji: string
  description: string
  arrivalText: string
  npcs: string[]
  encounterTags: string[]
  requiresQuestId?: string
  requiresLevel?: number
}

export const LOCATIONS: Record<LocationId, LocationDefinition> = {
  coliseum: {
    id: 'coliseum',
    name: 'The Breadcrumb Coliseum',
    emoji: '🏟️',
    description:
      'The grand arena at the heart of The Pond Eternal. Built from petrified breadcrumbs and ancient quacking magic.',
    arrivalText:
      'You arrive at the **Breadcrumb Coliseum**. The crowd roars as ten thousand ducks shuffle in their seats. The scent of stale bread fills the air. Chuck Norris watches from his golden nest above.',
    npcs: ['duchess', 'attenbird'],
    encounterTags: ['combat_lore', 'item', 'npc_duchess'],
  },
  puddle: {
    id: 'puddle',
    name: 'The Puddle of Doom',
    emoji: '💧',
    description: 'A suburban puddle of terrifying mundanity. A Honda Civic is parked nearby.',
    arrivalText:
      'You waddle up to **The Puddle of Doom**. It looks... ordinary. Too ordinary. A Honda Civic idles in the parking lot. A shopping cart rattles in the wind. Something is deeply wrong here.',
    npcs: ['chad'],
    encounterTags: ['suburban_horror', 'item', 'npc_chad'],
  },
  highway: {
    id: 'highway',
    name: 'The Migration Highway',
    emoji: '🦅',
    description: 'A mid-air route atop Gerald the flying goose. Hold on tight.',
    arrivalText:
      'You hop aboard **Gerald**, the legendary flying goose. The wind whips through your feathers as the Migration Highway stretches endlessly ahead. Gerald honks once. He does not elaborate.',
    npcs: ['gerald'],
    encounterTags: ['aerial', 'item', 'npc_gerald'],
  },
  quackatoa: {
    id: 'quackatoa',
    name: 'Lake Quackatoa',
    emoji: '🌋',
    description: 'A volcanic lake of obsidian cliffs and steam vents. The water is uncomfortably warm.',
    arrivalText:
      'The ground trembles as you approach **Lake Quackatoa**. Obsidian cliffs tower overhead. Steam vents hiss like angry kettles. Lava bubbles at the edges. This is either very dangerous or a very aggressive hot tub.',
    npcs: ['bigmouth'],
    encounterTags: ['volcanic', 'item', 'npc_bigmouth'],
  },
  parkBench: {
    id: 'parkBench',
    name: 'The Park Bench Thunderdome',
    emoji: '🪑',
    description: 'A park bench where Harold the old man sits. He throws bread sometimes.',
    arrivalText:
      'You arrive at **The Park Bench Thunderdome**. Harold, the old man, sits perfectly still on his bench. He watches you with the intensity of someone who has seen too much. A pigeon lands nearby. Harold does not blink.',
    npcs: ['harold'],
    encounterTags: ['park', 'item', 'npc_harold'],
  },
  frozenPond: {
    id: 'frozenPond',
    name: 'The Frozen Pond',
    emoji: '🧊',
    description: 'A treacherous sheet of ice. Everything is slippery. Nothing is safe.',
    arrivalText:
      'You step onto **The Frozen Pond** and immediately regret it. Your webbed feet skid in every direction. The ice is mirror-smooth and deeply unforgiving. Somewhere, a duck is screaming. It might be you.',
    npcs: ['trenchbill', 'frostbeak'],
    encounterTags: ['frozen', 'item', 'npc_frostbeak'],
  },
  breadcrumbVault: {
    id: 'breadcrumbVault',
    name: 'The Breadcrumb Vault',
    emoji: '🏦',
    description: 'A fortified vault beneath the Coliseum where the wealthiest ducks hoard their crumbs.',
    arrivalText:
      "You descend into **The Breadcrumb Vault**. Enormous iron doors groan open. Inside: mountains of preserved breadcrumbs, golden loaf sculptures, and the faint sound of an accountant weeping with joy. The Duchess's seal glows on the wall. You belong here now.",
    npcs: [],
    encounterTags: ['vault', 'item', 'rare'],
    requiresQuestId: 'duchess_favor',
  },
  greatNest: {
    id: 'greatNest',
    name: 'The Great Nest',
    emoji: '🪺',
    description: 'The mythical nest at the heart of the Quackverse. Ancient, vast, and humming with power.',
    arrivalText:
      'You pass through the Frozen Gate into **The Great Nest**. It stretches beyond sight — woven from golden feathers and petrified reeds older than memory. The air hums with something primal. Every duck who ever lived left a feather here. Somewhere deep within, something waits.',
    npcs: [],
    encounterTags: ['nest', 'legendary', 'item'],
    requiresQuestId: 'frozen_prophecy',
    requiresLevel: 7,
  },
}

export const ALL_LOCATION_IDS = Object.keys(LOCATIONS) as LocationId[]

/** Toll rates for gated locations (first visit free, subsequent visits cost breadcrumbs) */
export const TOLL_RATES: Partial<Record<LocationId, { cost: number; label: string }>> = {
  breadcrumbVault: { cost: 10, label: '10 🍞 toll' },
  greatNest: { cost: 15, label: '15 🍞 toll' },
}

export const formatLocationList = (currentLocation: LocationId, unlockedLocations?: string[]): string => {
  return Object.values(LOCATIONS)
    .map((loc, i) => {
      const current = loc.id === currentLocation ? ' *(you are here)*' : ''
      const locked = unlockedLocations && !unlockedLocations.includes(loc.id) ? ' 🔒' : ''
      const toll = TOLL_RATES[loc.id]
      const tollTag = toll && !locked ? ` *(${toll.label})*` : ''
      return `**${i + 1}.** ${loc.emoji} ${loc.name}${current}${locked}${tollTag}`
    })
    .join('\n')
}

export const getLocationByIndex = (index: number): LocationDefinition | undefined => {
  const ids = ALL_LOCATION_IDS
  if (index < 1 || index > ids.length) {
    return undefined
  }
  return LOCATIONS[ids[index - 1]!]
}
