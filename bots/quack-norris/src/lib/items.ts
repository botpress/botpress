export type ItemType =
  | 'hpPotion'
  | 'energyDrink'
  | 'shieldToken'
  | 'damageBoost'
  | 'mirrorShard'
  | 'quackGrenade'
  | 'breadcrumbMagnet'
  | 'fogBomb'

export type ItemDefinition = {
  id: ItemType
  name: string
  emoji: string
  description: string
  effect: string
}

export const ITEMS: Record<ItemType, ItemDefinition> = {
  hpPotion: {
    id: 'hpPotion',
    name: 'Bread Poultice',
    emoji: '🍞',
    description: 'A medicinal bread compress soaked in ancient pond water. Restores 20 HP instantly.',
    effect: '+20 HP',
  },
  energyDrink: {
    id: 'energyDrink',
    name: 'Pond Water Espresso',
    emoji: '☕',
    description: 'Triple-distilled pond scum with a breadcrumb garnish. Restores 15 energy instantly.',
    effect: '+15 Energy',
  },
  shieldToken: {
    id: 'shieldToken',
    name: "Chuck's Feather Token",
    emoji: '🪶',
    description: 'A golden feather plucked from Chuck Norris himself. Absorbs 25 damage once.',
    effect: 'Absorb next 25 dmg',
  },
  damageBoost: {
    id: 'damageBoost',
    name: 'Bread of Fury',
    emoji: '🔥',
    description: 'Enchanted sourdough forged in the fires of Quackatoa. +10 dmg on next attack.',
    effect: '+10 dmg next attack',
  },
  mirrorShard: {
    id: 'mirrorShard',
    name: 'Mirror Shard',
    emoji: '🪞',
    description: "A fragment of the Duchess's legendary vanity mirror. Reflects 50% damage back to attacker.",
    effect: 'Reflect 50% dmg once',
  },
  quackGrenade: {
    id: 'quackGrenade',
    name: 'Quack Grenade',
    emoji: '💣',
    description: 'An unstable breadcrumb device. Deals 15 dmg to all enemies.',
    effect: '15 AoE dmg to all foes',
  },
  breadcrumbMagnet: {
    id: 'breadcrumbMagnet',
    name: 'Breadcrumb Magnet',
    emoji: '🧲',
    description: 'Attracts stray breadcrumbs. Doubles breadcrumb rewards from your next encounter.',
    effect: '2x breadcrumbs next encounter',
  },
  fogBomb: {
    id: 'fogBomb',
    name: 'Fog Bomb',
    emoji: '🌫️',
    description: 'A vial of concentrated pond mist. All attacks against you miss for 1 round.',
    effect: 'Dodge all attacks 1 round',
  },
}

export const MAX_INVENTORY_SIZE = 6

export const formatInventory = (
  inventory: Array<{ itemId: string; name: string; type: ItemType; quantity: number }>
): string => {
  if (inventory.length === 0) {
    return '*Your inventory is empty. Explore the Quackverse to find items!*'
  }
  return inventory
    .map((item) => {
      const def = ITEMS[item.type]
      return `${def.emoji} **${def.name}** x${item.quantity} — ${def.effect}`
    })
    .join('\n')
}

export const addItemToInventory = (
  inventory: Array<{ itemId: string; name: string; type: ItemType; quantity: number }>,
  itemType: ItemType
): boolean => {
  const def = ITEMS[itemType]
  const existing = inventory.find((i) => i.type === itemType)
  if (existing) {
    existing.quantity += 1
    return true
  }
  if (inventory.length >= MAX_INVENTORY_SIZE) {
    return false
  }
  inventory.push({ itemId: itemType, name: def.name, type: itemType, quantity: 1 })
  return true
}

export const resolveItemName = (name: string): ItemType | undefined => {
  const lower = name.toLowerCase()
  const aliases: Record<string, ItemType> = {
    hp: 'hpPotion',
    potion: 'hpPotion',
    bread: 'hpPotion',
    hppotion: 'hpPotion',
    energy: 'energyDrink',
    espresso: 'energyDrink',
    coffee: 'energyDrink',
    energydrink: 'energyDrink',
    shield: 'shieldToken',
    feather: 'shieldToken',
    token: 'shieldToken',
    shieldtoken: 'shieldToken',
    damage: 'damageBoost',
    fury: 'damageBoost',
    damageboost: 'damageBoost',
    mirror: 'mirrorShard',
    shard: 'mirrorShard',
    mirrorshard: 'mirrorShard',
    grenade: 'quackGrenade',
    quackgrenade: 'quackGrenade',
    bomb: 'quackGrenade',
    magnet: 'breadcrumbMagnet',
    breadcrumbmagnet: 'breadcrumbMagnet',
    fog: 'fogBomb',
    fogbomb: 'fogBomb',
    mist: 'fogBomb',
  }
  return aliases[lower]
}
