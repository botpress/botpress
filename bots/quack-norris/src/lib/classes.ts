import type { ClassDefinition, DuckClass } from './types'

export const DUCK_CLASSES: Record<DuckClass, ClassDefinition> = {
  mallardNorris: {
    id: 'mallardNorris',
    name: 'Mallard Norris',
    emoji: '🥊',
    description: 'A brawler who hits harder the closer to death. Bloodquack passive + Roundhouse Kick special.',
    maxHp: 110,
    maxEnergy: 100,
    attackMod: 0.1,
    defenseMod: -0.05,
    passiveName: 'Bloodquack',
    passiveDescription: '+25% dmg below 30% HP, +50% below 15% HP',
    specialName: 'Roundhouse Kick',
    specialDescription: '30-45 dmg to one target. Cooldown resets on kill.',
    specialCooldown: 4,
    specialEnergyCost: 40,
  },
  quackdini: {
    id: 'quackdini',
    name: 'Quackdini',
    emoji: '🎩',
    description: 'A trickster with 20% dodge chance. Mirror Decoy negates an attack and reflects 20 dmg.',
    maxHp: 85,
    maxEnergy: 120,
    attackMod: 0,
    defenseMod: 0,
    passiveName: 'Smoke & Feathers',
    passiveDescription: '20% dodge chance. After dodging, next attack deals +10 bonus dmg.',
    specialName: 'Mirror Decoy',
    specialDescription: 'Negate next incoming attack and reflect 20 dmg to attacker.',
    specialCooldown: 3,
    specialEnergyCost: 50,
  },
  sirQuacksALot: {
    id: 'sirQuacksALot',
    name: 'Sir Quacks-A-Lot',
    emoji: '🛡️',
    description: 'A paladin tank. Blocking heals 8 HP (10 energy). Divine Shield absorbs 30 dmg.',
    maxHp: 120,
    maxEnergy: 90,
    attackMod: -0.1,
    defenseMod: 0.2,
    passiveName: 'Holy Plumage',
    passiveDescription: 'Successful block heals 8 HP.',
    specialName: 'Divine Shield',
    specialDescription: 'Shield self or ally, absorbing next 30 dmg. Lasts 2 rounds.',
    specialCooldown: 5,
    specialEnergyCost: 45,
  },
  drQuackenstein: {
    id: 'drQuackenstein',
    name: 'Dr. Quackenstein',
    emoji: '🧪',
    description: 'A warlock. All attacks apply poison (4 dmg/round, 3 turns). Plague Bomb hits all enemies for 15.',
    maxHp: 90,
    maxEnergy: 130,
    attackMod: 0,
    defenseMod: 0,
    passiveName: 'Toxic Aura',
    passiveDescription: 'Attacks apply 3-round poison (4 dmg/round, stacks up to 2x).',
    specialName: 'Plague Bomb',
    specialDescription: '15 dmg to ALL enemies + apply poison.',
    specialCooldown: 5,
    specialEnergyCost: 55,
  },
}

export const CLASS_LORE: Record<DuckClass, string> = {
  mallardNorris:
    'Born during the Great Bread Famine, Mallard Norris learned to fight before he learned to swim. They say he once roundhouse kicked a loaf of bread so hard it became toast. His bloodline carries the fury of a thousand angry geese, and when his health drops low, something primal awakens — the Bloodquack. Chuck Norris himself adopted this fighting style after losing a staring contest with the original Mallard.',
  quackdini:
    'The legendary stage magician who vanished during his own show and never came back. Some say Quackdini never left — he simply became invisible and has been stealing breadcrumbs from the audience ever since. His Mirror Decoy technique was perfected after decades of evading angry theater critics. "The wing is quicker than the eye," he whispers, before disappearing in a puff of feathers.',
  sirQuacksALot:
    'Ordained by The Great Mallard during the Third Breadcrumb Crusade, Sir Quacks-A-Lot took a vow to protect the innocent and block every attack aimed at his allies. His Holy Plumage glows with divine energy when he successfully blocks a heavy blow, healing his wounds through sheer righteousness. He speaks exclusively in noble proclamations and refers to everyone as "good sir" or "fair maiden duck."',
  drQuackenstein:
    'Once a respected bread scientist at the Pond Eternal University, Dr. Quackenstein was expelled after his "experiments" turned the entire chemistry department green. Now he wages war with bubbling vials and toxic concoctions, poisoning everything he touches. His Plague Bomb is banned in 47 ponds, but he insists the side effects are "mostly cosmetic." His lab coat has never been washed.',
}

export const CLASS_ALIASES: Record<string, DuckClass> = {
  mallard: 'mallardNorris',
  norris: 'mallardNorris',
  quackdini: 'quackdini',
  trickster: 'quackdini',
  sir: 'sirQuacksALot',
  paladin: 'sirQuacksALot',
  doc: 'drQuackenstein',
  warlock: 'drQuackenstein',
}

export const resolveClassAlias = (input: string): DuckClass | undefined => {
  const normalized = input.toLowerCase().trim()
  return (
    CLASS_ALIASES[normalized] ??
    (Object.keys(DUCK_CLASSES).includes(normalized) ? (normalized as DuckClass) : undefined)
  )
}

const CLASS_TAGLINES: Record<DuckClass, string> = {
  mallardNorris: 'Hits harder the closer to death. Born to brawl.',
  quackdini: 'Now you see me... actually, too late.',
  sirQuacksALot: 'Holy tank. Blocks heal. Shields protect.',
  drQuackenstein: "Everything is toxic. That's science.",
}

export const formatClassList = (): string => {
  return Object.values(DUCK_CLASSES)
    .map(
      (c) =>
        `${c.emoji} **${c.name}** — ${c.description}\n  Passive: *${c.passiveName}* — ${c.passiveDescription}\n  Special: *${c.specialName}* (${c.specialEnergyCost} energy, ${c.specialCooldown}r CD) — ${c.specialDescription}`
    )
    .join('\n\n')
}

export const formatCompactClassList = (): string => {
  return Object.values(DUCK_CLASSES)
    .map((c) => `${c.emoji} **${c.name}** — ${CLASS_TAGLINES[c.id]}`)
    .join('\n')
}

export const formatClassDetails = (duckClass: DuckClass): string => {
  const c = DUCK_CLASSES[duckClass]
  const atkSign = c.attackMod >= 0 ? '+' : ''
  const defSign = c.defenseMod >= 0 ? '+' : ''
  const aliases = Object.entries(CLASS_ALIASES)
    .filter(([, v]) => v === c.id)
    .map(([k]) => `\`${k}\``)
    .join(', ')

  const lore = CLASS_LORE[duckClass]

  return [
    `${c.emoji} **${c.name}**`,
    `> *${CLASS_TAGLINES[c.id]}*`,
    '',
    `*${lore}*`,
    '',
    `**Stats:** ${c.maxHp} HP | ${c.maxEnergy} Energy | ATK ${atkSign}${Math.round(c.attackMod * 100)}% | DEF ${defSign}${Math.round(c.defenseMod * 100)}%`,
    `**Passive:** *${c.passiveName}* — ${c.passiveDescription}`,
    `**Special:** *${c.specialName}* (${c.specialEnergyCost} energy, ${c.specialCooldown}r cooldown) — ${c.specialDescription}`,
    '',
    `**Aliases:** ${aliases}`,
  ].join('\n')
}
