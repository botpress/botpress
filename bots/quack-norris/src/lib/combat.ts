import { DUCK_CLASSES } from './classes'
import type { ActionType, CombatEvent, DuckClass, Player, StatusEffect } from './types'

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const chance = (percent: number) => Math.random() * 100 < percent

// Energy costs per action type
export const ENERGY_COSTS: Record<ActionType, number> = {
  light: 10,
  heavy: 25,
  block: 10, // was 15 — rebalanced to match light cost
  rest: 0,
  special: 0, // varies by class, handled separately
  forfeit: 0,
}

// Base damage ranges
const DAMAGE_RANGES: Record<'light' | 'heavy', { min: number; max: number }> = {
  light: { min: 10, max: 18 },
  heavy: { min: 25, max: 38 },
}

const CRIT_CHANCE = 15
const CRIT_MULTIPLIER = 1.5
const BASE_DODGE_CHANCE = 5
const QUACKDINI_DODGE_CHANCE = 20
const COMBO_THRESHOLD = 3
const COMBO_BONUS_DAMAGE = 15
const ENERGY_REGEN_PER_ROUND = 8 // was 5 — buffed for better flow
const REST_ENERGY_RECOVERY = 30
const REST_DAMAGE_INCREASE = 0.15
const POISON_DAMAGE_PER_TICK = 4
const POISON_MAX_STACKS = 2
const POISON_DURATION = 3
const BLESSED_DAMAGE_BONUS = 0.3
const BLOCK_LIGHT_REDUCTION = 0.5
const MAX_MULTIPLIER = 2.0 // cap on additive damage multipliers (before crit)

export type DamageResult = {
  damage: number
  isCrit: boolean
  isDodged: boolean
  isBlocked: boolean
  isBlockPartial: boolean
  comboTriggered: boolean
  poisonApplied: boolean
}

export const getSpecialEnergyCost = (duckClass: DuckClass): number => {
  return DUCK_CLASSES[duckClass].specialEnergyCost
}

export const hasEnoughEnergy = (player: Player, actionType: ActionType): boolean => {
  const cost =
    actionType === 'special' && player.duckClass ? getSpecialEnergyCost(player.duckClass) : ENERGY_COSTS[actionType]
  return (player.energy ?? 0) >= cost
}

export const deductEnergy = (player: Player, actionType: ActionType): void => {
  const cost =
    actionType === 'special' && player.duckClass ? getSpecialEnergyCost(player.duckClass) : ENERGY_COSTS[actionType]
  player.energy = Math.max(0, (player.energy ?? 0) - cost)
}

export const regenerateEnergy = (player: Player): void => {
  player.energy = Math.min(player.maxEnergy, (player.energy ?? 0) + ENERGY_REGEN_PER_ROUND)
}

export const applyRest = (player: Player): void => {
  player.energy = Math.min(player.maxEnergy, (player.energy ?? 0) + REST_ENERGY_RECOVERY)
  addStatusEffect(player, { type: 'resting', turnsLeft: 1 })
}

export const getBloodquackMultiplier = (player: Player): number => {
  if (player.duckClass !== 'mallardNorris') {
    return 1
  }
  const hpPercent = player.hp / player.maxHp
  if (hpPercent <= 0.15) {
    return 1.5
  }
  if (hpPercent <= 0.3) {
    return 1.25
  }
  return 1
}

export const getDodgeChance = (player: Player): number => {
  return player.duckClass === 'quackdini' ? QUACKDINI_DODGE_CHANCE : BASE_DODGE_CHANCE
}

export const attemptDodge = (target: Player): boolean => {
  return chance(getDodgeChance(target))
}

export const calculateDamage = (
  attacker: Player,
  target: Player,
  actionType: 'light' | 'heavy',
  isBlocking: boolean
): DamageResult => {
  const result: DamageResult = {
    damage: 0,
    isCrit: false,
    isDodged: false,
    isBlocked: false,
    isBlockPartial: false,
    comboTriggered: false,
    poisonApplied: false,
  }

  // Fog Bomb: auto-dodge all attacks this round
  if (hasStatusEffect(target, 'dodgeAll')) {
    result.isDodged = true
    return result
  }

  // Check dodge (only non-blocked attacks can be dodged)
  if (!hasStatusEffect(target, 'exposed') && attemptDodge(target)) {
    result.isDodged = true
    // Quackdini dodge bonus: mark for next attack
    if (target.duckClass === 'quackdini') {
      addStatusEffect(target, { type: 'inspired', turnsLeft: 1 })
    }
    return result
  }

  // Check block — heavy attacks fully blocked, light attacks halved
  if (isBlocking) {
    if (actionType === 'heavy') {
      result.isBlocked = true
      return result
    }
    // Light attacks vs block: 50% damage reduction
    result.isBlockPartial = true
  }

  // Calculate base damage
  const range = DAMAGE_RANGES[actionType]
  let damage = randomBetween(range.min, range.max)

  // Build additive multiplier (capped at MAX_MULTIPLIER)
  let multiplier = 1.0

  // Attacker class modifier
  if (attacker.duckClass) {
    const classDef = DUCK_CLASSES[attacker.duckClass]
    multiplier += classDef.attackMod
  }

  // Bloodquack (Mallard Norris passive)
  const bloodquack = getBloodquackMultiplier(attacker)
  if (bloodquack > 1) {
    multiplier += bloodquack - 1
  }

  // Blessed bonus (+30% dmg)
  if (hasStatusEffect(attacker, 'blessed')) {
    multiplier += BLESSED_DAMAGE_BONUS
  }

  // Target defense modifier (subtractive)
  if (target.duckClass) {
    const targetClass = DUCK_CLASSES[target.duckClass]
    multiplier -= targetClass.defenseMod
  }

  // Resting targets take extra damage
  if (hasStatusEffect(target, 'resting')) {
    multiplier += REST_DAMAGE_INCREASE
  }

  // Cap multiplier before crit
  multiplier = Math.min(multiplier, MAX_MULTIPLIER)

  // Apply multiplier
  damage = Math.round(damage * multiplier)

  // Block partial reduction (light vs block)
  if (result.isBlockPartial) {
    damage = Math.round(damage * BLOCK_LIGHT_REDUCTION)
  }

  // Inspired bonus (all classes — primarily granted to Quackdini on dodge)
  if (hasStatusEffect(attacker, 'inspired')) {
    damage += 10
    removeStatusEffect(attacker, 'inspired')
  }

  // DamageBoost bonus (from items or combo — works for ALL classes)
  const damageBoostEffect = (attacker.statusEffects ?? []).find((e) => e.type === 'damageBoost')
  if (damageBoostEffect) {
    damage += damageBoostEffect.stacks ?? 10
    removeStatusEffect(attacker, 'damageBoost')
  }

  // Critical hit (applied AFTER multiplier cap)
  if (chance(CRIT_CHANCE)) {
    damage = Math.round(damage * CRIT_MULTIPLIER)
    result.isCrit = true
  }

  // Combo check
  if (attacker.consecutiveTargetId === target.discordUserId) {
    attacker.consecutiveHits = (attacker.consecutiveHits ?? 0) + 1
    if (attacker.consecutiveHits >= COMBO_THRESHOLD) {
      damage += COMBO_BONUS_DAMAGE
      result.comboTriggered = true
      addStatusEffect(attacker, { type: 'damageBoost', turnsLeft: 2, stacks: 15 })
      attacker.consecutiveHits = 0
    }
  } else {
    attacker.consecutiveTargetId = target.discordUserId
    attacker.consecutiveHits = 1
  }

  // Apply damage
  result.damage = Math.max(1, damage)
  target.hp = Math.max(0, target.hp - result.damage)

  // Dr. Quackenstein toxic aura
  if (attacker.duckClass === 'drQuackenstein') {
    applyPoison(target)
    result.poisonApplied = true
  }

  return result
}

// --- Special Abilities ---

export type SpecialResult = {
  events: CombatEvent[]
  kills: string[]
}

export const executeSpecial = (caster: Player, target: Player | undefined, allPlayers: Player[]): SpecialResult => {
  const events: CombatEvent[] = []
  const kills: string[] = []

  if (!caster.duckClass) {
    return { events, kills }
  }

  switch (caster.duckClass) {
    case 'mallardNorris': {
      if (!target || !target.alive) {
        break
      }
      const damage = randomBetween(30, 45)
      const finalDamage = Math.round(damage * getBloodquackMultiplier(caster))
      target.hp = Math.max(0, target.hp - finalDamage)
      events.push({
        text: `${caster.name} unleashes a ROUNDHOUSE KICK on ${target.name} for ${finalDamage} dmg!`,
        type: 'special',
      })
      // Apply exposed to surviving target
      if (target.hp > 0) {
        addStatusEffect(target, { type: 'exposed', turnsLeft: 1 })
        events.push({
          text: `${target.name} is left EXPOSED by the Roundhouse Kick!`,
          type: 'status',
        })
      }
      if (target.hp <= 0) {
        target.alive = false
        kills.push(target.name)
        caster.specialCooldown = 0 // Reset on kill
        events.push({
          text: `${target.name} has been eliminated! Mallard Norris's cooldown resets!`,
          type: 'elimination',
        })
      }
      break
    }

    case 'quackdini': {
      addStatusEffect(caster, { type: 'decoy', turnsLeft: 2 })
      events.push({
        text: `${caster.name} conjures a Mirror Decoy! The next attack will be reflected!`,
        type: 'special',
      })
      break
    }

    case 'sirQuacksALot': {
      // In free-for-all, always self-shield (no allies). Target shielding reserved for future team mode.
      addStatusEffect(caster, { type: 'shielded', turnsLeft: 2, stacks: 30 })
      events.push({
        text: `${caster.name} casts Divine Shield on themselves! (absorbs up to 30 dmg)`,
        type: 'special',
      })
      break
    }

    case 'drQuackenstein': {
      const enemies = allPlayers.filter((p) => p.alive && p.discordUserId !== caster.discordUserId)
      // Scale AoE damage: cap total output at ~30 to prevent domination in small games
      const perTargetDmg = enemies.length > 0 ? Math.min(15, Math.round(30 / enemies.length)) : 15
      for (const enemy of enemies) {
        enemy.hp = Math.max(0, enemy.hp - perTargetDmg)
        applyPoison(enemy)
        if (enemy.hp <= 0 && enemy.alive) {
          enemy.alive = false
          kills.push(enemy.name)
        }
      }
      events.push({
        text: `${caster.name} throws a PLAGUE BOMB! All enemies take ${perTargetDmg} dmg and are poisoned!`,
        type: 'special',
      })
      break
    }
    default:
      break
  }

  return { events, kills }
}

// --- Status Effects ---

export const addStatusEffect = (player: Player, effect: StatusEffect): void => {
  if (!player.statusEffects) {
    player.statusEffects = []
  }

  if (effect.type === 'poison') {
    const existing = player.statusEffects.find((e) => e.type === 'poison')
    if (existing) {
      existing.stacks = Math.min(POISON_MAX_STACKS, (existing.stacks ?? 1) + 1)
      existing.turnsLeft = POISON_DURATION
      return
    }
  }

  // For non-stackable effects, refresh duration
  const existing = player.statusEffects.find((e) => e.type === effect.type)
  if (existing) {
    existing.turnsLeft = effect.turnsLeft
    if (effect.stacks !== undefined) {
      existing.stacks = effect.stacks
    }
    return
  }

  player.statusEffects.push(effect)
}

export const removeStatusEffect = (player: Player, type: string): void => {
  if (!player.statusEffects) {
    return
  }
  player.statusEffects = player.statusEffects.filter((e) => e.type !== type)
}

export const hasStatusEffect = (player: Player, type: string): boolean => {
  return (player.statusEffects ?? []).some((e) => e.type === type)
}

export const tickStatusEffects = (players: Player[]): CombatEvent[] => {
  const events: CombatEvent[] = []

  for (const player of players) {
    if (!player.alive || !player.statusEffects) {
      continue
    }

    // Apply poison damage
    const poison = player.statusEffects.find((e) => e.type === 'poison')
    if (poison) {
      const poisonDmg = POISON_DAMAGE_PER_TICK * (poison.stacks ?? 1)
      player.hp = Math.max(0, player.hp - poisonDmg)
      events.push({ text: `${player.name} takes ${poisonDmg} poison damage!`, type: 'status' })
    }

    // Decrement all durations
    player.statusEffects = player.statusEffects
      .map((e) => ({ ...e, turnsLeft: e.turnsLeft - 1 }))
      .filter((e) => e.turnsLeft > 0)
  }

  return events
}

export const applyPoison = (target: Player): void => {
  addStatusEffect(target, { type: 'poison', turnsLeft: POISON_DURATION, stacks: 1 })
}

// --- Shield (Decoy / Divine Shield) interaction ---

export const processShieldedAttack = (
  attacker: Player,
  target: Player,
  damage: number
): { absorbed: boolean; reflected: boolean; reflectDamage: number } => {
  // Quackdini decoy: negate + reflect 20
  if (hasStatusEffect(target, 'decoy')) {
    removeStatusEffect(target, 'decoy')
    target.hp = Math.min(target.maxHp, target.hp + damage) // Undo damage
    attacker.hp = Math.max(0, attacker.hp - 20)
    return { absorbed: true, reflected: true, reflectDamage: 20 }
  }

  // Divine Shield / Shield Token: absorb up to stacks value (or 30 for Divine Shield)
  if (hasStatusEffect(target, 'shielded')) {
    const shieldEffect = (target.statusEffects ?? []).find((e) => e.type === 'shielded')
    const absorptionCap = shieldEffect?.stacks ?? 30 // Divine Shield defaults to 30
    const absorbed = Math.min(damage, absorptionCap)
    target.hp = Math.min(target.maxHp, target.hp + absorbed) // Undo absorbed portion
    removeStatusEffect(target, 'shielded')
    return { absorbed: true, reflected: false, reflectDamage: 0 }
  }

  return { absorbed: false, reflected: false, reflectDamage: 0 }
}

// --- Combo Reset ---

export const resetComboCounters = (players: Player[]): void => {
  for (const player of players) {
    player.consecutiveHits = 0
    player.consecutiveTargetId = undefined
  }
}

// --- Cooldown Management ---

export const decrementCooldowns = (players: Player[]): void => {
  for (const player of players) {
    if (player.specialCooldown > 0) {
      player.specialCooldown--
    }
  }
}

// --- HP Bar Rendering ---

export const renderHpBar = (current: number, max: number, length = 10): string => {
  const filled = Math.round((current / max) * length)
  const empty = length - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

export const renderEnergyBar = (current: number, max: number, length = 8): string => {
  const filled = Math.round((current / max) * length)
  const empty = length - filled
  return `[${'⚡'.repeat(filled)}${'·'.repeat(empty)}]`
}
