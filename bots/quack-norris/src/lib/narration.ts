import { DUCK_CLASSES } from './classes'
import { renderHpBar, renderEnergyBar } from './combat'
import type { DuckClass, Player } from './types'

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

// --- Light Attack Templates ---
const LIGHT_ATTACK_TEMPLATES = [
  "{attacker} delivers a swift wing-slap to {target}'s face! {damage} dmg! The audacity!",
  '{attacker} pecks {target} with surgical precision. {damage} dmg. It looked like it stung.',
  '{attacker} waddles up and casually smacks {target} for {damage} dmg. Disrespectful.',
  'A quick jab from {attacker}! {target} takes {damage} dmg and looks personally offended.',
  '{attacker} does the classic drive-by wing-buffet! {target} eats {damage} dmg for lunch!',
  '{attacker} feints left, feints right, then just... bonks {target}. {damage} dmg. Simple but effective.',
  'With the grace of a swan and the mercy of a goose, {attacker} taps {target} for {damage} dmg.',
  '{attacker} throws a rapid-fire peck combo! {target} absorbs {damage} dmg of pure beak fury!',
  'QUACK! {attacker} lands a sneaky tail-whip on {target}! {damage} dmg! Where did that come from?!',
  '{attacker} launches a bread-speed strike! {target} takes {damage} dmg before they can even blink!',
]

const LIGHT_ATTACK_LOW_DMG_TEMPLATES = [
  '{attacker} barely grazes {target} for {damage} dmg. That was more of a suggestion than an attack.',
  "{attacker} hits {target} for {damage} dmg. {target} isn't even sure they were hit. Was that a breeze?",
  'A glancing blow from {attacker}! {target} takes {damage} dmg and looks more confused than hurt.',
  '{attacker} connects with {target} for {damage} dmg. Somewhere, Chuck Norris sighs in disappointment.',
  "{attacker} taps {target} for {damage} dmg. It's like being attacked by a strong opinion.",
]

// --- Heavy Attack Templates ---
const HEAVY_ATTACK_TEMPLATES = [
  '{attacker} winds up a DEVASTATING wing slam on {target}! {damage} dmg! The pond trembles!',
  '{attacker} unleashes the Quack Attack on {target}! A thunderous {damage} dmg! Bread crumbs fly everywhere!',
  'WHAM! {attacker} hits {target} with a full-body cannonball! {damage} dmg! Someone call a vet!',
  '{attacker} channels the spirit of Chuck Norris and OBLITERATES {target} for {damage} dmg!',
  'The crowd gasps as {attacker} delivers a flying drop-kick to {target}! {damage} dmg! Absolutely feral!',
  '{attacker} does the forbidden Spinning Beak Tornado on {target}! {damage} dmg! That move was banned in three ponds!',
  'With righteous fury, {attacker} brings down the Hammer of Quack on {target}! {damage} dmg! The arena shakes!',
  "{attacker} goes FULL GOOSE on {target}! {damage} dmg! That's not even legal in most waterways!",
  "A CRITICAL WADDLE from {attacker}! {target} takes a staggering {damage} dmg! The physics don't even make sense!",
  '{attacker} summons the ancient art of Wing-Fu and demolishes {target} for {damage} dmg! Sensational!',
]

// --- Critical Hit Templates ---
const CRIT_TEMPLATES = [
  "CRITICAL HIT! {attacker} just discovered the meaning of maximum damage on {target}'s face! {damage} dmg!",
  "OH QUACK! That's a CRIT! {attacker} channels pure chaos into {target} for {damage} dmg! Chuck Norris nods from above!",
  'DEVASTATING! {attacker} rolls a natural 20 on {target}! {damage} dmg! The arena falls silent, then erupts!',
  'A PERFECT strike from {attacker}! {target} takes {damage} dmg and briefly sees the face of The Great Mallard!',
  'QUACK-A-DOODLE-DOOM! {attacker} lands the hit of a lifetime on {target}! {damage} dmg! Write that one down!',
]

// --- Block Templates ---
const BLOCK_SUCCESS_TEMPLATES = [
  "{attacker} swings with everything they've got, but {target} saw it coming! BLOCKED! Not today!",
  "CLANG! {attacker}'s heavy attack meets {target}'s iron defense! 0 dmg! The crowd goes wild!",
  '{attacker} launches a devastating strike but {target} blocks it like they read the script! DENIED!',
  '{target} catches {attacker}\'s heavy blow with pure defensive instinct! "Nice try," they quack.',
  "The force of {attacker}'s attack sends shockwaves through the arena, but {target} doesn't budge! BLOCKED!",
  '{attacker} winds up the big one... and {target} yawns while deflecting it. Embarrassing.',
  "BONK goes {attacker}'s attack right off {target}'s shield! The only thing damaged here is {attacker}'s ego.",
  "{target} blocks {attacker}'s heavy attack so hard it creates a small sonic boom. The breadcrumbs scatter!",
]

const BLOCK_NO_ATTACK_TEMPLATES = [
  '{player} hunkers down behind their wings. Nothing comes. Awkward.',
  "{player} braces for impact... and waits... and waits. The attack never comes. That's 60 seconds they'll never get back.",
  '{player} assumes a perfect defensive stance. Nobody attacks them. They feel weirdly disappointed.',
  "{player} blocks absolutely nothing. It's like bringing an umbrella to a drought.",
  '{player} crouches defensively, eyes darting everywhere. Not a single attack. They stand back up, dusting off imaginary dust.',
  '{player} spent the entire round blocking. The ghosts they were fighting put up a good match, though.',
]

// --- Block Partial Templates (light attack vs block = 50% reduction) ---
const BLOCK_PARTIAL_TEMPLATES = [
  '{attacker} slips a quick strike past {target}\'s guard! Partially blocked — {damage} dmg! "That still stings!"',
  "{target}'s block catches most of {attacker}'s light attack, but {damage} dmg gets through! A glancing blow!",
  "DEFLECTED! {target} braces against {attacker}'s quick strike — only {damage} dmg lands. The block holds!",
  '{attacker} pecks at {target}\'s defenses! The block absorbs half the blow — {damage} dmg! "Is that all you\'ve got?"',
  "{target}'s shield arm strains as {attacker}'s light attack pushes through for {damage} dmg! Blocked, but felt.",
  'A chip shot from {attacker}! {target} blocks the worst of it but takes {damage} dmg through their guard. Resourceful!',
]

// --- Dodge Templates ---
const DODGE_TEMPLATES = [
  "{target} ducks! (Yes, that pun was intentional.) {attacker}'s attack whiffs completely!",
  'DODGED! {target} moves like liquid! {attacker} hits nothing but air and regret!',
  "{target} sidesteps with impossible grace! {attacker}'s {attackType} attack misses entirely!",
  "Smoke and feathers! {target} vanishes from the path of {attacker}'s attack! MISSED!",
  '{attacker} swings at {target} but {target} is already somewhere else entirely! How?!',
  "{target} bends backwards like they just downloaded the Matrix! {attacker}'s {attackType} attack sails overhead!",
  'Now you see {target}, now you — wait, where did they go?! {attacker} strikes a ghost! A GHOST DUCK!',
  "{target} does a perfect backflip over {attacker}'s {attackType} attack! The crowd loses their minds! Style points!",
  'The fog swallows {target} whole! {attacker} swings wildly at nothing! The mist laughs!',
]

// --- Elimination Templates ---
const ELIMINATION_TEMPLATES = [
  '{player} collapses in a dramatic heap of feathers! ELIMINATED! Pour one out for the fallen fowl!',
  'AND {player} IS DOWN! The crowd hurls bread in tribute! A warrior falls! A legend begins!',
  "{player} has been sent to the Great Pond in the Sky! (They'll respawn next game, don't worry.)",
  "That's all she quacked! {player} has been ELIMINATED! Their feathers scatter in the wind dramatically!",
  "{player} falls! As they hit the ground, a single golden feather drifts down from Chuck Norris's nest. Respect.",
  'ELIMINATED! {player} waddles off into the sunset... of defeat! Their journey ends here, but what a ride!',
  '{player} has left the mortal pond! The breadcrumbs of destiny have spoken! ELIMINATED!',
  'Down goes {player}! DOWN GOES {player}! The arena medics rush in with emergency bread!',
]

const FIRST_ELIMINATION_TEMPLATES = [
  '**FIRST BLOOD!** The arena claims its first victim! {player} has fallen! The Quacktament has truly begun!',
  '**AND SO IT BEGINS!** {player} is the first to fall! Let their sacrifice remind us all: this pond takes no prisoners!',
  '**ONE DOWN!** {player} has been sent to the spectator seats the hard way! The field narrows!',
]

const FINAL_TWO_TEMPLATES = [
  '**THE FINAL TWO!** {eliminated} falls, leaving only {player1} and {player2}! THIS IS IT! THE ULTIMATE SHOWDOWN!',
  '**DOWN TO THE WIRE!** {eliminated} is gone! {player1} vs {player2}! ONE FIGHT! ONE WINNER! ONE BREADCRUMB TO RULE THEM ALL!',
  '**SUDDEN DEATH INCOMING!** {eliminated} exits stage left, and we have our FINAL DUEL! {player1} faces {player2}!',
]

// --- Rest Templates ---
const REST_TEMPLATES = [
  '💤 {player} takes a breather, recovering energy. Smart... or cowardly? The crowd debates hotly. A pigeon is removed from the gallery.',
  '💤 {player} sits down in the middle of the arena, produces a tiny thermos, and sips. The audacity of resting during a Quacktament. Bold. Reckless. Iconic.',
  '💤 {player} closes their eyes and draws power from The Pond Eternal. The breadcrumbs around them levitate briefly. Energy restored.',
  '💤 {player} pulls out a miniature breadcrumb snack and stress-eats it mid-combat. The crumbs fall like snow. Energy refueled. Dignity questionable.',
  '💤 {player} folds their wings, tucks their head, and enters a micro-nap. The arena holds its breath. Three seconds later: eyes open. Recharged. Terrifying.',
  '💤 {player} leans against the arena wall like they own the place. "Wake me when it gets interesting," they quack. Energy restored.',
]

// --- Special Ability Templates ---
const SPECIAL_TEMPLATES: Record<DuckClass, string[]> = {
  mallardNorris: [
    '{caster} ROUNDHOUSE KICKS {target} with the fury of a thousand angry ducks! {damage} dmg! Chuck Norris sheds a single tear of pride!',
    "IT'S THE ROUNDHOUSE! {caster} channels pure Norris energy into {target}! {damage} dmg! The arena floor CRACKS!",
    "{caster} spins with the force of a duck tornado and DEMOLISHES {target}! {damage} dmg! That's gonna leave a mark!",
  ],
  quackdini: [
    '{caster} snaps their wing and a perfect Mirror Decoy appears! "Hit THIS," they quack with a smirk.',
    'POOF! {caster} conjures a shimmering decoy! The next attack will learn a painful lesson about trust!',
    '{caster} performs the ancient art of Quackception! A Mirror Decoy stands ready to absorb and reflect!',
  ],
  sirQuacksALot: [
    '{caster} raises their wings to the sky and calls upon Holy Plumage! A Divine Shield descends upon {target}!',
    'By the power of The Great Mallard! {caster} bestows a Divine Shield on {target}! 30 dmg absorbed!',
    "{caster}'s eyes glow golden as they channel divine energy into a protective shield for {target}!",
  ],
  drQuackenstein: [
    '{caster} cackles maniacally and hurls a PLAGUE BOMB! Toxic green mist engulfs the arena!',
    'PLAGUE BOMB! {caster} unleashes a concoction of questionable origin! Everyone is now slightly poisoned!',
    '{caster} throws a bubbling vial that EXPLODES! Poison clouds everywhere! The breadcrumbs turn green!',
  ],
}

// --- Lore Intro (shown before class selection) ---
const LORE_INTRO_TEMPLATES = [
  '**Welcome to The Pond Eternal** — a pocket dimension where ducks achieved sentience, discovered violence, and decided it was hilarious. At its center stands the **Arena of Mallard Destiny**, built from petrified breadcrumbs. Chuck Norris watches from his golden nest above. Choose wisely.',
  'Long ago, **The Great Mallard** sneezed the universe into existence and laid seven primordial eggs. The seventh — the **Egg of Violence** — hatched Chuck Norris, the first Warrior Duck. He declared every duck must fight. And so began the **Eternal Quacktament**. Your turn.',
  'From the murky depths of **The Pond Eternal**, warriors gather at the **Breadcrumb Coliseum** — where crumbs become legends. Chuck Norris nods from his golden nest. The crowd of ten thousand ducks holds its breath. The Quacktament calls for new champions.',
  'In the Quackverse, all realities where ducks achieved sentience converge at one place: **The Pond Eternal**. At its heart, the **Arena of Mallard Destiny** awaits. Chuck Norris adjusts his tiny sunglasses. The breadcrumbs are fresh. It is time to choose your fighter.',
]

export const narrateLoreIntro = (): string => {
  return pick(LORE_INTRO_TEMPLATES)
}

// --- Opening Ceremony ---
const OPENING_CEREMONY_TEMPLATES = [
  "**=== THE QUACKTAMENT BEGINS ===**\n\nThe trumpets blare! The breadcrumbs fly! The crowd of ten thousand ducks loses their collective mind!\n\nChuck Norris descends from his golden nest, gives a single approving nod, and the Arena floor trembles.\n\nFighters, the rules are simple: be the last duck standing. Or don't. We're not your mom.",
  '**=== WELCOME TO THE ARENA OF MALLARD DESTINY ===**\n\nFrom the depths of The Pond Eternal, warriors have gathered! The Great Mallard watches from beyond! Chuck Norris adjusts his tiny sunglasses!\n\nThis is it. This is the moment. This is... *dramatic pause* ...QUACK-NORRIS!',
  '**=== LET THE FEATHERS FLY ===**\n\nLadies, gentleducks, and whatever a goose is --\n\nWelcome to the only combat sport where the participants are adorable AND terrifying! The arena is set! The breadcrumbs are fresh! The violence is about to be UNREASONABLE!\n\nChuck Norris has blessed this match. May your quacks be mighty and your blocks be timely.',
  '**=== THE POND ETERNAL TREMBLES ===**\n\nAnother day, another battle for the ages! Ducks have flown from every corner of the Quackverse to settle their differences the old-fashioned way: ORGANIZED VIOLENCE!\n\nChuck Norris cracks open a tiny soda in his golden nest. He is ready. Are you?',
]

// --- Round Start Templates ---
const ROUND_START_EARLY = [
  '**-- Round {n} --**\nThe fighters circle each other like sharks in a very small pond. Breadcrumbs crunch underfoot. The crowd leans forward. Someone drops a pretzel. Nobody notices.',
  "**-- Round {n} --**\nThe air crackles with barely-contained violence. Feathers drift like snow. Chuck Norris sips from a golden chalice. We're just getting started.",
  '**-- Round {n} --**\nAnother round dawns on the Quacktament! The fighters flex their wings and narrow their eyes. The Arena Scribe dips their quill. History awaits.',
  '**-- Round {n} --**\nThe breadcrumb dust settles. The fighters lock eyes across the arena. Somewhere in the stands, a duck drops their monocle. The tension is unbearable.',
]

const ROUND_START_MID = [
  '**-- Round {n} --**\nThe battle rages on! Feathers carpet the arena floor like macabre confetti. The bread merchants have tripled their prices. War profiteering at its finest.',
  "**-- Round {n} --**\nWe're deep in it now. The fighters' eyes tell stories of pain, determination, and a profound desire to not be the one who dies next. This is what legends are made of.",
  '**-- Round {n} --**\nThe arena floor is more feather than breadcrumb at this point. A medic duck nervously sharpens a tongue depressor. Round {n} begins and even the wind holds its breath.',
  '**-- Round {n} --**\nBlood, sweat, and breadcrumbs. The unholy trinity of the Quacktament. The fighters circle with the wary respect of opponents who have survived this long. Round {n}.',
]

const ROUND_START_LATE = [
  '**-- Round {n} --**\nThis has gone LONG! The crowd is FERAL! Chuck Norris has leaned forward in his nest — and he NEVER leans forward! The Arena Scribe is running out of parchment! THIS IS HISTORY!',
  "**-- Round {n} --**\nROUND {n}?! We haven't seen a fight go this deep since the Great Bread War of '09! These ducks are IMMORTAL! Or very, very stubborn! Either way, the crowd is getting their money's worth!",
  '**-- Round {n} --**\nAt this point, the fighters are running on pure spite, adrenaline, and the fumes of breadcrumbs long since consumed. Round {n}! THE QUACKTAMENT DEMANDS MORE! THE QUACKTAMENT ALWAYS DEMANDS MORE!',
  '**-- Round {n} --**\nThe sun has moved. The shadows have shifted. The breadcrumb vendors have closed shop and gone home. But the fighters? The fighters remain. Round {n}. This is personal now.',
]

// --- Victory Templates ---
const VICTORY_TEMPLATES = [
  '**=== VICTORY! ===**\n\nThe arena ERUPTS! {winner} stands alone atop a mountain of breadcrumbs, wings spread, quacking triumphantly into the void!\n\nChuck Norris drops a golden feather from his nest. The highest honor.\n\n**{winner} is the CHAMPION OF THE QUACKTAMENT!**',
  '**=== THE LAST DUCK STANDING ===**\n\nWhen the feathers settle and the dust clears, only one duck remains: **{winner}**!\n\nThey have fought. They have suffered. They have quacked in the face of adversity. And now? Now they hold the Golden Breadcrumb high.\n\nChuck Norris slow-claps from his nest. It sounds like thunder.',
  '**=== CHAMPION CROWNED ===**\n\n*{winner}* has done the impossible, the improbable, the slightly ridiculous!\n\nAll hail **{winner}**, Champion of the Quacktament!',
  '**=== GLORY! GLORY! QUACKELUJAH! ===**\n\nLet the record show: on this day, **{winner}** looked destiny in the eye, quacked at it, and WON!\n\nThe Golden Breadcrumb is theirs! The title is theirs!\n\nChuck Norris salutes. The universe quacks in approval.',
]

// --- Draw Templates ---
const DRAW_TEMPLATES = [
  "**=== DRAW! ===**\n\nIn a twist nobody saw coming, ALL remaining fighters have fallen simultaneously! The Arena is silent. A tumbleweed made of feathers rolls by.\n\nChuck Norris shrugs. Even legends don't have answers for everything.\n\n**No winner today. But what a fight!**",
  "**=== MUTUAL DESTRUCTION ===**\n\nThey came. They fought. They ALL fell. The breadcrumbs claim no champion today.\n\n**It's a draw! Everybody loses! Nobody wins! Somehow that's poetic!**",
  "**=== TIME'S UP ===**\n\nThe sands of the hourglass have run dry and no champion has emerged!\n\nChuck Norris checks his watch and declares this one a DRAW.\n\n**Fight harder next time!**",
]

// --- Sir David Attenbird Commentary ---
const LOW_HP_COMMENTARY = [
  '*Sir David Attenbird observes: "{player}, now critically wounded, draws upon reserves of strength they did not know they possessed. Or perhaps it is adrenaline. Or denial."*',
  '*"{player} clings to consciousness with the tenacity of a duck clinging to the last breadcrumb in the bag. One suspects this cannot last much longer."*',
  '*One notices {player} is looking rather... translucent. At {hp} HP, they are one strong breeze away from elimination.*',
  '*The remarkable {player} continues to fight at {hp} HP! Most ducks would have surrendered, but this one appears to have chosen violence over self-preservation. Extraordinary.*',
]

const FINAL_SHOWDOWN_COMMENTARY = [
  '*Sir David Attenbird whispers: "And here we are. Two ducks. One arena. The air itself seems to hold its breath. This is nature at its most... dramatic."*',
  '*"The final two combatants lock eyes across the breadcrumb-strewn arena. {player1} vs {player2}. This is what we came for."*',
  '*The entire Quackverse narrows to this single moment. {player1} ({hp1} HP) faces {player2} ({hp2} HP). The Golden Breadcrumb awaits.*',
]

const UNDERDOG_COMMENTARY = [
  '*AGAINST ALL ODDS! {player}, battered and bruised at {hp} HP, just landed a MASSIVE hit! Chuck Norris STANDS UP in his nest!*',
  '*Sir David Attenbird, visibly emotional: "The underdog rises! {player}, whom we all counted out, strikes back with fury!"*',
  '*This is the comeback story we LIVE for! {player} at {hp} HP just went FULL LEGEND!*',
]

const BLOODBATH_COMMENTARY = [
  '*Sir David Attenbird removes his monocle: "What... what just happened? {count} ducks fell in a single round! This is CARNAGE!"*',
  '*A MASSACRE! {count} eliminations in one round! The arena is littered with defeated ducks and scattered feathers!*',
]

const STALEMATE_COMMENTARY = [
  '*Sir David Attenbird coughs politely: "That round was... contemplative. No damage was dealt. Perhaps the fighters are engaged in psychological warfare."*',
  '*Nothing happened. Literally nothing. Chuck Norris looks disappointed. The crowd throws stale bread.*',
]

// --- Template Helpers ---

const fill = (template: string, vars: Record<string, string | number>): string => {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value))
  }
  return result
}

// --- Public API ---

export const narrateLightAttack = (attacker: string, target: string, damage: number): string => {
  const templates = damage <= 12 ? LIGHT_ATTACK_LOW_DMG_TEMPLATES : LIGHT_ATTACK_TEMPLATES
  return fill(pick(templates), { attacker, target, damage })
}

export const narrateHeavyAttack = (attacker: string, target: string, damage: number): string => {
  return fill(pick(HEAVY_ATTACK_TEMPLATES), { attacker, target, damage })
}

export const narrateCriticalHit = (attacker: string, target: string, damage: number): string => {
  return fill(pick(CRIT_TEMPLATES), { attacker, target, damage })
}

export const narrateBlockSuccess = (attacker: string, target: string): string => {
  return fill(pick(BLOCK_SUCCESS_TEMPLATES), { attacker, target })
}

export const narrateBlockNoAttack = (player: string): string => {
  return fill(pick(BLOCK_NO_ATTACK_TEMPLATES), { player })
}

export const narrateBlockPartial = (attacker: string, target: string, damage: number): string => {
  return fill(pick(BLOCK_PARTIAL_TEMPLATES), { attacker, target, damage })
}

export const narrateDodge = (attacker: string, target: string, attackType: string): string => {
  return fill(pick(DODGE_TEMPLATES), { attacker, target, attackType })
}

export const narrateElimination = (player: string, isFirst: boolean, remainingPlayers?: { name: string }[]): string => {
  if (isFirst) {
    return fill(pick(FIRST_ELIMINATION_TEMPLATES), { player })
  }

  if (remainingPlayers && remainingPlayers.length === 2) {
    return fill(pick(FINAL_TWO_TEMPLATES), {
      eliminated: player,
      player1: remainingPlayers[0]!.name,
      player2: remainingPlayers[1]!.name,
    })
  }

  return fill(pick(ELIMINATION_TEMPLATES), { player })
}

export const narrateRest = (player: string): string => {
  return fill(pick(REST_TEMPLATES), { player })
}

export const narrateSpecial = (caster: string, target: string, duckClass: DuckClass, damage?: number): string => {
  const templates = SPECIAL_TEMPLATES[duckClass]
  return fill(pick(templates), { caster, target: target || 'themselves', damage: damage ?? 0 })
}

export const narrateOpeningCeremony = (): string => {
  return pick(OPENING_CEREMONY_TEMPLATES)
}

export const narrateRoundStart = (round: number): string => {
  let templates: string[]
  if (round <= 3) {
    templates = ROUND_START_EARLY
  } else if (round <= 7) {
    templates = ROUND_START_MID
  } else {
    templates = ROUND_START_LATE
  }
  return fill(pick(templates), { n: round })
}

export const narrateVictory = (winner: string): string => {
  return fill(pick(VICTORY_TEMPLATES), { winner })
}

export const narrateDraw = (): string => {
  return pick(DRAW_TEMPLATES)
}

// --- Contextual Commentary (Sir David Attenbird) ---

export const generateCommentary = (
  players: Player[],
  eliminationsThisRound: number,
  totalDamageThisRound: number
): string | undefined => {
  const alive = players.filter((p) => p.alive)

  // Bloodbath round
  if (eliminationsThisRound >= 2) {
    return fill(pick(BLOODBATH_COMMENTARY), { count: eliminationsThisRound })
  }

  // Final showdown
  if (alive.length === 2) {
    return fill(pick(FINAL_SHOWDOWN_COMMENTARY), {
      player1: alive[0]!.name,
      player2: alive[1]!.name,
      hp1: alive[0]!.hp,
      hp2: alive[1]!.hp,
    })
  }

  // Low HP player
  const lowHpPlayer = alive.find((p) => p.hp > 0 && p.hp <= p.maxHp * 0.25)
  if (lowHpPlayer) {
    return fill(pick(LOW_HP_COMMENTARY), { player: lowHpPlayer.name, hp: lowHpPlayer.hp })
  }

  // Stalemate
  if (totalDamageThisRound === 0) {
    return pick(STALEMATE_COMMENTARY)
  }

  // Underdog (lowest HP player dealt damage)
  const lowestHpAlive = alive.reduce((min, p) => (p.hp < min.hp ? p : min), alive[0]!)
  if (lowestHpAlive.hp <= lowestHpAlive.maxHp * 0.3 && totalDamageThisRound > 20) {
    return fill(pick(UNDERDOG_COMMENTARY), { player: lowestHpAlive.name, hp: lowestHpAlive.hp })
  }

  return undefined
}

// --- Player Status Rendering ---

export const renderPlayerStatus = (player: Player): string => {
  const classDef = player.duckClass ? DUCK_CLASSES[player.duckClass] : undefined
  const classTag = classDef ? ` ${classDef.emoji} ${classDef.name}` : ''
  const hpBar = renderHpBar(player.hp, player.maxHp)
  const energyBar = renderEnergyBar(player.energy, player.maxEnergy)
  const statusIcons = (player.statusEffects ?? [])
    .map((e) => {
      switch (e.type) {
        case 'poison':
          return `🧪x${e.stacks ?? 1}`
        case 'inspired':
          return '✨'
        case 'blessed':
          return '🥋'
        case 'shielded':
          return '🛡️'
        case 'decoy':
          return '🪞'
        case 'resting':
          return '💤'
        case 'exposed':
          return '⚠️'
        case 'damageBoost':
          return '💪'
        case 'dodgeAll':
          return '🌫️'
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join(' ')

  const alive = player.alive ? '' : ' 💀'
  const cooldown = player.specialCooldown > 0 ? ` | Special: ${player.specialCooldown}r` : ' | Special: READY'

  return `${player.name}${classTag}${alive}\n  HP: ${hpBar} ${player.hp}/${player.maxHp} | Energy: ${energyBar} ${player.energy}/${player.maxEnergy}${cooldown}${statusIcons ? ` | ${statusIcons}` : ''}`
}
