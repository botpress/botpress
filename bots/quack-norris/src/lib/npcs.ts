import type { ItemType } from './items'
import type { LocationId } from './locations'

export type NpcId = 'duchess' | 'chad' | 'gerald' | 'bigmouth' | 'harold' | 'frostbeak' | 'trenchbill' | 'attenbird'

export type NpcDialogue = {
  greeting: string
  noQuest: string
  questAvailable: string
  questInProgress: string
  questComplete: string
  postQuestDialogue?: string
}

export type ShopItem = {
  itemType: ItemType
  cost: number
  quantity?: number
  label?: string
}

export type NpcDefinition = {
  id: NpcId
  name: string
  emoji: string
  location: LocationId
  description: string
  dialogue: NpcDialogue
  shopInventory?: ShopItem[]
  shopRequiresQuestId?: string
}

export const NPCS: Record<NpcId, NpcDefinition> = {
  duchess: {
    id: 'duchess',
    name: 'Duchess Featherington',
    emoji: '👑',
    location: 'coliseum',
    description: 'The imperious socialite of the Coliseum. She judges everyone and everything.',
    dialogue: {
      greeting:
        '*Duchess Featherington adjusts her monocle and fixes you with a withering stare.* "Ah, you again. I suppose you want something. Everyone always wants something."',
      noQuest: '"I have nothing for you at the moment, darling. Go punch something. Preferably not me."',
      questAvailable:
        '*The Duchess lowers her voice conspiratorially.* "I might have a... proposition for you. Something that requires a certain... lack of dignity. Interested?"',
      questInProgress:
        '"Still working on that little errand? Do try to keep up, darling. My patience has an expiration date."',
      questComplete:
        '*The Duchess claps once, sharply.* "Splendid! You managed not to disappoint. A rare occurrence in this cesspool of mediocrity."',
      postQuestDialogue:
        'Ah, my champion returns. The Coliseum remembers what you did for us. *adjusts tiara* Need anything?',
    },
    shopInventory: [
      { itemType: 'hpPotion', cost: 40, quantity: 2, label: 'Royal Healing Draught (heals double)' },
      { itemType: 'energyDrink', cost: 40, quantity: 2, label: 'Coliseum Energy Elixir (restores double)' },
      { itemType: 'shieldToken', cost: 60, quantity: 1, label: "Duchess's Royal Shield" },
      { itemType: 'damageBoost', cost: 60, quantity: 1, label: "Champion's War Banner" },
    ],
    shopRequiresQuestId: 'duchess_favor',
  },
  chad: {
    id: 'chad',
    name: 'Chad Gullsworth',
    emoji: '🦅',
    location: 'puddle',
    description: 'A loud, obnoxious seagull who treats the Puddle of Doom like his personal kingdom.',
    dialogue: {
      greeting:
        '*Chad Gullsworth swoops down and lands on the Honda Civic.* "WELL WELL WELL! Look who decided to grace MY puddle with their presence!"',
      noQuest: '"I got NOTHING for you right now. But stick around, I\'m SURE something will come up. IT ALWAYS DOES."',
      questAvailable:
        '*Chad puffs up his chest.* "HEY! Yeah, YOU! I got a JOB for you. And by job I mean a PROBLEM that I need someone ELSE to solve!"',
      questInProgress:
        '"You still haven\'t done that thing? COME ON! I could have done it myself by now! ...I just choose not to."',
      questComplete:
        '*Chad looks genuinely surprised.* "Wait, you actually DID it? Huh. Okay. I guess you\'re not COMPLETELY useless. Here."',
      postQuestDialogue:
        "BRO! You actually believed in me when nobody else did. That's... *sniff* ...that's tight, bro. Chad remembers.",
    },
  },
  gerald: {
    id: 'gerald',
    name: 'Gerald',
    emoji: '🪿',
    location: 'highway',
    description: 'A wise flying goose who communicates exclusively in honks. He understands everything.',
    dialogue: {
      greeting: '*Gerald banks left and glances at you with one ancient, knowing eye.* "HONK."',
      noQuest: '"HONK." *Gerald shakes his head slowly. There is nothing for you here. Not yet.*',
      questAvailable:
        '*Gerald circles three times — the universal goose signal for "I have something important." He honks twice, urgently.*',
      questInProgress: '"HONK." *Gerald gives you a look that somehow conveys both patience and mild disappointment.*',
      questComplete: '"HONK HONK!" *Gerald does a barrel roll of joy. A feather drifts down. It feels like approval.*',
      postQuestDialogue: "*HONK* (It's a warm honk. Gerald remembers.)",
    },
  },
  bigmouth: {
    id: 'bigmouth',
    name: 'Big Mouth McGee',
    emoji: '🐦',
    location: 'quackatoa',
    description: 'An enormous pelican who lives in the volcanic lake. Everything is a riddle or a deal with him.',
    dialogue: {
      greeting:
        '*Big Mouth McGee surfaces from the lava, steam rising from his enormous beak.* "WELL WELL WELL! Another visitor to my VOLCANIC DOMAIN!"',
      noQuest:
        "\"No jobs right now. But I've got RIDDLES if you want 'em. Actually, I've got riddles even if you DON'T want 'em.\"",
      questAvailable:
        '*McGee\'s eyes gleam.* "I\'ve got a PROPOSITION for you. And unlike my riddles, this one has a RIGHT answer. Interested?"',
      questInProgress:
        '"You\'re STILL working on that? I could solve it in my SLEEP! ...I sleep in lava, so that\'s saying something."',
      questComplete:
        '*McGee opens his enormous beak in what might be a smile.* "NOT BAD! Not bad at all! Here\'s your reward — straight from the pouch!"',
      postQuestDialogue: "THE LEGEND RETURNS! The one who actually survived my riddles! ...well, 'riddles.' ANYWAY!",
    },
  },
  harold: {
    id: 'harold',
    name: 'Harold',
    emoji: '👴',
    location: 'parkBench',
    description: 'An ancient old man on a park bench. He says nothing. He sees everything.',
    dialogue: {
      greeting: '*Harold sits on his bench. He does not acknowledge your arrival. But he knows.*',
      noQuest: '*Harold stares straight ahead. A pigeon lands on his shoulder. Neither moves.*',
      questAvailable:
        '*Harold slowly turns his head toward you. This has never happened before. He reaches into his coat pocket and produces a crumpled note.*',
      questInProgress: '*Harold holds up one finger. Then puts it down. You understand: not yet.*',
      questComplete:
        '*Harold nods once. Just once. But in that nod is the weight of a thousand unspoken words and what might — if you squint — be pride.*',
      postQuestDialogue:
        '*Harold looks up from his chess board. For the briefest moment, you see something in his eyes. Recognition. Respect. He gestures to the empty seat across from him.*',
    },
  },
  frostbeak: {
    id: 'frostbeak',
    name: 'Frostbeak',
    emoji: '🧊',
    location: 'frozenPond',
    description: 'A duck frozen in ice for centuries. Still conscious. Still sarcastic.',
    dialogue: {
      greeting:
        '*Frostbeak\'s icy eyes follow you.* "Oh! A visitor! I\'d wave but... you know. Frozen. What century is this?"',
      noQuest: '"I have nothing for you right now. But stick around — I\'m not going anywhere. Ha. Ha. Frozen humor."',
      questAvailable:
        '*Frostbeak\'s eyes widen.* "Actually... I just remembered something. Something from before the ice. Something important. Can you help me?"',
      questInProgress:
        '"How\'s that thing going? Take your time. I\'ve got literally nothing but time. ...Please hurry."',
      questComplete:
        '*A crack runs through the ice around Frostbeak. A single tear freezes on their cheek.* "You did it. Thank you. I... remember now."',
      postQuestDialogue:
        "You... thawed more than just ice that day. *quiet pause* And the Egg — whatever you chose, I felt it resonate through the ice. I won't forget. What brings you back to the cold?",
    },
  },
  trenchbill: {
    id: 'trenchbill',
    name: 'Trenchbill',
    emoji: '🧥',
    location: 'frozenPond',
    description:
      'A shady vendor in a battered trenchcoat. Sells questionable goods at reasonable prices. No eye contact.',
    dialogue: {
      greeting: '*Trenchbill opens his coat slightly.* "Psst. Hey. You buyin\'? I got goods."',
      noQuest: '"No jobs right now. But I got MERCHANDISE. Always got merchandise."',
      questAvailable:
        '*Trenchbill looks both ways, then up, then down.* "Hey. I got a job. Pays well. Don\'t ask questions. ...You\'re already asking questions with your eyes. Stop that."',
      questInProgress: '"You still on that thing? Tick tock, friend. Time is breadcrumbs."',
      questComplete:
        '*Trenchbill nods approvingly.* "Nice work. Clean. Professional. Here\'s your cut." *He slides something across without making eye contact.*',
      postQuestDialogue:
        'Well, well... my favorite business partner. *adjusts trenchcoat* The underground never forgets a friend.',
    },
    shopInventory: [
      { itemType: 'hpPotion', cost: 20 },
      { itemType: 'energyDrink', cost: 20 },
      { itemType: 'shieldToken', cost: 35 },
      { itemType: 'damageBoost', cost: 35 },
    ],
  },
  attenbird: {
    id: 'attenbird',
    name: 'Sir David Attenbird',
    emoji: '🎬',
    location: 'coliseum',
    description:
      'A distinguished duck in a tweed jacket and tiny monocle, flanked by an invisible camera crew. Documents everything.',
    dialogue: {
      greeting:
        '*Sir David Attenbird adjusts his tiny monocle.* "Ah, the remarkable Quacktament participant. Observe how they approach — a mixture of confidence and mild confusion. Truly fascinating."',
      noQuest:
        '"I\'m merely observing today. The natural world requires patience. And breadcrumbs. Mostly breadcrumbs."',
      questAvailable:
        '*Attenbird clears his throat.* "I\'m producing a documentary on the Quackverse. I could use... a protagonist. Would you be interested in being filmed?"',
      questInProgress:
        '"The documentary is coming along splendidly. Your contribution has been... adequate. Keep going."',
      questComplete:
        '*Attenbird removes his monocle and wipes it.* "Magnificent footage. This will win awards. You, my friend, are a natural."',
      postQuestDialogue:
        '*Sir Attenbird adjusts his monocle* Ah, my documentary star! The footage from our adventure has been... quite extraordinary. Riveting television, if I may say so.',
    },
  },
}

// --- NPC Helpers ---

export const getNpcsAtLocation = (locationId: LocationId): NpcDefinition[] => {
  return Object.values(NPCS).filter((npc) => npc.location === locationId)
}

export const getNpcById = (id: string): NpcDefinition | undefined => {
  return NPCS[id as NpcId]
}

export const resolveNpcAlias = (input: string): NpcId | undefined => {
  const lower = input.toLowerCase().trim()
  const aliases: Record<string, NpcId> = {
    duchess: 'duchess',
    featherington: 'duchess',
    chad: 'chad',
    gullsworth: 'chad',
    gerald: 'gerald',
    goose: 'gerald',
    bigmouth: 'bigmouth',
    mcgee: 'bigmouth',
    pelican: 'bigmouth',
    harold: 'harold',
    oldman: 'harold',
    frostbeak: 'frostbeak',
    frost: 'frostbeak',
    trenchbill: 'trenchbill',
    trench: 'trenchbill',
    vendor: 'trenchbill',
    shop: 'trenchbill',
    attenbird: 'attenbird',
    david: 'attenbird',
    documentary: 'attenbird',
  }
  return aliases[lower] ?? (Object.keys(NPCS).includes(lower) ? (lower as NpcId) : undefined)
}

export const formatNpcList = (npcs: NpcDefinition[]): string => {
  return npcs.map((npc) => `${npc.emoji} **${npc.name}** — ${npc.description}`).join('\n')
}

export const formatShop = (npc: NpcDefinition, playerBreadcrumbs: number): string | undefined => {
  if (!npc.shopInventory || npc.shopInventory.length === 0) {
    return undefined
  }

  // Inline item definitions to avoid circular imports
  const itemNames: Record<string, { name: string; emoji: string; effect: string }> = {
    hpPotion: { name: 'Bread Poultice', emoji: '🍞', effect: '+20 HP' },
    energyDrink: { name: 'Pond Water Espresso', emoji: '☕', effect: '+15 Energy' },
    shieldToken: { name: "Chuck's Feather Token", emoji: '🪶', effect: 'Absorb next 25 dmg' },
    damageBoost: { name: 'Bread of Fury', emoji: '🔥', effect: '+10 dmg next attack' },
    mirrorShard: { name: 'Mirror Shard', emoji: '🪞', effect: 'Reflect 50% dmg once' },
    quackGrenade: { name: 'Quack Grenade', emoji: '💣', effect: '15 AoE dmg to all foes' },
    breadcrumbMagnet: { name: 'Breadcrumb Magnet', emoji: '🧲', effect: '2x breadcrumbs next encounter' },
    fogBomb: { name: 'Fog Bomb', emoji: '🌫️', effect: 'Dodge all attacks 1 round' },
  }

  const lines = npc.shopInventory.map((item, i) => {
    const def = itemNames[item.itemType]!
    const affordable = playerBreadcrumbs >= item.cost ? '' : " *(can't afford)*"
    const displayName = item.label ?? def.name
    const qty = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''
    return `**${i + 1}.** ${def.emoji} ${displayName}${qty} — ${item.cost} 🍞${affordable}\n   *${def.effect}*`
  })

  return [
    `**${npc.emoji} ${npc.name}'s Shop**`,
    '',
    ...lines,
    '',
    `**Your breadcrumbs:** ${playerBreadcrumbs} 🍞`,
    '*Type a number or `!buy <number>` to purchase.*',
  ].join('\n')
}
