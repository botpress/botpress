export type DuckClass = 'mallardNorris' | 'quackdini' | 'sirQuacksALot' | 'drQuackenstein'

export type ActionType = 'light' | 'heavy' | 'block' | 'rest' | 'special' | 'forfeit'

export type StatusEffectType =
  | 'poison'
  | 'inspired'
  | 'exposed'
  | 'shielded'
  | 'decoy'
  | 'resting'
  | 'blessed'
  | 'damageBoost'
  | 'dodgeAll'

export type StatusEffect = {
  type: StatusEffectType
  turnsLeft: number
  stacks?: number
  sourceId?: string
}

export type GamePhase = 'registration' | 'classSelection' | 'combat' | 'finished'

export type Player = {
  discordUserId: string
  name: string
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  alive: boolean
  duckClass?: DuckClass
  statusEffects: StatusEffect[]
  specialCooldown: number
  consecutiveTargetId?: string
  consecutiveHits: number
}

export type GameAction = {
  discordUserId: string
  type: ActionType
  targetUserId?: string
}

export type CombatEvent = {
  text: string
  type: 'attack' | 'block' | 'special' | 'status' | 'elimination' | 'chaos' | 'commentary' | 'rest'
}

export type ClassDefinition = {
  id: DuckClass
  name: string
  emoji: string
  description: string
  maxHp: number
  maxEnergy: number
  attackMod: number
  defenseMod: number
  passiveName: string
  passiveDescription: string
  specialName: string
  specialDescription: string
  specialCooldown: number
  specialEnergyCost: number
}
