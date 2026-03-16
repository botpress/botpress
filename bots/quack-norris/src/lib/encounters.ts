import type { ItemType } from './items'
import type { LocationId } from './locations'

export type EncounterType = 'npc' | 'discovery' | 'lore'

export type EncounterChoice = {
  label: string
  outcome: string
  reward?: ItemType
  /** Breadcrumb gain (positive) or loss (negative) from this choice */
  breadcrumbDelta?: number
  /** XP gain (positive) or loss (negative) from this choice */
  xpDelta?: number
}

export type EncounterDefinition = {
  id: string
  type: EncounterType
  location: LocationId | 'any'
  narrative: string
  choices: EncounterChoice[]
  questTrigger?: { questId: string; stepId: string }
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

// --- NPC Encounters ---

const NPC_ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'duchess_judgment',
    type: 'npc',
    location: 'coliseum',
    narrative:
      '**Duchess Featherington** glides toward you, monocle gleaming. *"My my, another aspiring gladiator? Let me assess your... potential."* She circles you with devastating elegance.\n\n*"I shall offer you a choice, darling."*',
    choices: [
      {
        label: 'Bow respectfully',
        outcome:
          'You bow low. The Duchess nods approvingly. *"Manners. How refreshingly rare in this cesspool of violence."* She tosses you a small vial.',
        reward: 'hpPotion',
        breadcrumbDelta: 3,
      },
      {
        label: 'Challenge her to a staring contest',
        outcome:
          'You lock eyes with the Duchess. Three minutes pass. Your eyes water. She does not blink once. *"Amusing,"* she says, and hands you a consolation prize.',
        reward: 'energyDrink',
        breadcrumbDelta: -3,
      },
      {
        label: 'Compliment her feathers',
        outcome:
          '*"Obviously they are magnificent. But I appreciate the observation."* She reaches into her gown and produces a shard of her legendary vanity mirror. *"For a duck with taste."*',
        reward: 'mirrorShard',
        xpDelta: 8,
      },
    ],
  },
  {
    id: 'duchess_gala',
    type: 'npc',
    location: 'coliseum',
    narrative:
      '**Duchess Featherington** sweeps past in a gown made entirely of breadcrumbs. *"Darling! You simply MUST attend my soirée tonight. The Coliseum\'s upper gallery. Formal attire required — and by formal, I mean feathers."*\n\nShe hands you an invitation on gold-leaf bread.',
    choices: [
      {
        label: 'Attend in your finest feathers',
        outcome:
          'You arrive looking spectacular. The Duchess introduces you to her inner circle. *"This one has potential,"* she declares. A servant hands you a gift box.',
        reward: 'damageBoost',
        breadcrumbDelta: -4,
      },
      {
        label: 'Show up fashionably late',
        outcome:
          'The party is winding down when you arrive. *"Hmph. Late, but at least you came."* She tosses you a leftover party favor — it glows faintly.',
        reward: 'shieldToken',
      },
      {
        label: 'RSVP "No" with a counter-invitation',
        outcome:
          'The Duchess reads your note and laughs — actually laughs. *"The audacity! I respect it."* She sends you a gift as a peace offering.',
        reward: 'hpPotion',
        xpDelta: 10,
      },
    ],
  },
  {
    id: 'chad_theft',
    type: 'npc',
    location: 'puddle',
    narrative:
      '**Chad Gullsworth** swoops down and lands on the Honda Civic. *"NICE BREADCRUMBS YOU GOT THERE! BE A SHAME IF SOMEONE... REDISTRIBUTED THEM!"* He cackles and steals a breadcrumb from your pocket.',
    choices: [
      {
        label: 'Chase him',
        outcome:
          'You chase Chad around the parking lot for five minutes. He drops something shiny in his escape. Victory through cardio!',
        reward: 'damageBoost',
        breadcrumbDelta: -5,
      },
      {
        label: 'Offer him more breadcrumbs',
        outcome:
          "Chad is so confused by generosity that he drops everything he's carrying and flies away in a panic. You pick up a potion he left behind.",
        reward: 'hpPotion',
        breadcrumbDelta: 4,
      },
      {
        label: 'Ignore him completely',
        outcome:
          'You stare blankly ahead. Chad gets increasingly agitated. *"HEY! HEY ARE YOU LISTENING?!"* He throws a coffee at you in frustration. It\'s still warm.',
        reward: 'energyDrink',
      },
    ],
  },
  {
    id: 'chad_rematch',
    type: 'npc',
    location: 'puddle',
    narrative:
      '**Chad Gullsworth** is back, perched atop the Honda Civic\'s roof with arms crossed. *"YOU AGAIN? Listen, last time was a FLUKE. I challenge you to a BREADCRUMB DUEL! Three breadcrumbs each. Whoever eats theirs fastest wins. I\'ve been TRAINING."*\n\nHe produces six breadcrumbs from behind his back.',
    choices: [
      {
        label: 'Accept the duel',
        outcome:
          'You vacuum down three breadcrumbs in 1.2 seconds. Chad stares, mouth full, breadcrumb stuck to his beak. *"...HOW?!"* He drops his prize in shock.',
        reward: 'damageBoost',
        breadcrumbDelta: -6,
      },
      {
        label: 'Challenge him to a different contest instead',
        outcome:
          '*"A STARING CONTEST?! YOU\'RE ON!"* Chad blinks immediately. He throws a tantrum and kicks over his own stash. You pick up the pieces.',
        reward: 'energyDrink',
        xpDelta: 8,
      },
      {
        label: 'Steal his breadcrumbs mid-speech',
        outcome:
          'While Chad monologues about his training regimen, you casually eat all six breadcrumbs. He turns around to an empty table. *"...I respect the hustle."* In his rage, he hurls a smoking sphere at you — but it\'s actually useful.',
        reward: 'quackGrenade',
        xpDelta: 15,
      },
    ],
  },
  {
    id: 'bigmouth_wager',
    type: 'npc',
    location: 'quackatoa',
    narrative:
      '**Big Mouth McGee** surfaces from the volcanic lake, steam rising from his enormous beak. *"WELL WELL WELL! A visitor! Tell you what — I\'ll make you a deal. I\'ve got something good in my pouch. But you gotta earn it."*',
    choices: [
      {
        label: 'Accept the challenge',
        outcome:
          'McGee spits a jet of boiling water. You dodge! *"Not bad, not bad!"* He tosses you a glowing bread from his pouch. It\'s warm but intact.',
        reward: 'damageBoost',
        breadcrumbDelta: -5,
      },
      {
        label: 'Ask what the catch is',
        outcome:
          '*"The CATCH?! HA! The catch is I\'m a PELICAN! Get it?!"* He laughs so hard a feather token falls out of his beak.',
        reward: 'shieldToken',
        breadcrumbDelta: 3,
      },
      {
        label: 'Try to peek in his pouch',
        outcome:
          'Big Mouth snaps his beak shut. *"RUDE!"* But in the commotion, an energy drink rolls out. Finders keepers.',
        reward: 'energyDrink',
        breadcrumbDelta: -3,
      },
    ],
  },
  {
    id: 'bigmouth_riddle',
    type: 'npc',
    location: 'quackatoa',
    narrative:
      '**Big Mouth McGee** rises from the volcanic depths, lava dripping from his enormous beak. *"RIDDLE TIME! Answer correctly and you get a PRIZE. Answer wrong and you get a DIFFERENT prize. I haven\'t decided which is better."*\n\nHe clears his throat. *"What has bread but no mouth, feathers but no wings, and is currently standing in a volcano?"*',
    choices: [
      {
        label: '"A breadcrumb golem?"',
        outcome:
          '*"CLOSE ENOUGH!"* McGee slaps you on the back (nearly knocking you into lava) and hands you a glowing potion. *"You win the good prize! ...I think."*',
        reward: 'hpPotion',
      },
      {
        label: '"You, Big Mouth."',
        outcome:
          'McGee\'s eyes go wide. *"...That\'s... actually correct. I AM standing in a volcano. I have bread in my pouch. And my wings are decorative at best."* He hands you something shiny, looking existential.',
        reward: 'shieldToken',
      },
      {
        label: '"Is this a trick question?"',
        outcome:
          '*"EVERYTHING is a trick question when you\'re a pelican in a volcano!"* He cackles and tosses you the "wrong" prize. It seems fine.',
        reward: 'damageBoost',
      },
    ],
  },
  {
    id: 'gerald_wisdom',
    type: 'npc',
    location: 'highway',
    narrative:
      'Gerald the flying goose banks left suddenly. You grab onto his feathers. *"HONK."* He seems to want to tell you something. He gestures with his wing toward a cloud formation that looks suspiciously like a breadcrumb.',
    choices: [
      {
        label: 'Reach for the cloud',
        outcome:
          "You lean over and... it's actually a floating bread poultice, held aloft by pure Quackverse magic. Gerald honks approvingly.",
        reward: 'hpPotion',
      },
      {
        label: 'Ask Gerald for life advice',
        outcome:
          'Gerald turns his head 180 degrees to look at you. *"HONK."* You feel strangely energized. Was that... wisdom?',
        reward: 'energyDrink',
      },
      {
        label: 'Do a barrel roll',
        outcome:
          'You and Gerald do a barrel roll through the clouds. When you stabilize, you find a golden feather caught in your wing. Gerald looks proud.',
        reward: 'shieldToken',
      },
    ],
  },
  {
    id: 'gerald_detour',
    type: 'npc',
    location: 'highway',
    narrative:
      'Gerald takes an abrupt detour into a thundercloud. Lightning crackles. Rain pelts your face. Gerald seems completely unbothered.\n\n*"HONK."*\n\nThrough the storm, you see three glowing objects suspended in mid-air. Gerald circles them patiently.',
    choices: [
      {
        label: 'Grab the red one',
        outcome:
          "You snatch the red orb. It's warm — almost hot. It pulses with aggressive energy. Gerald honks once, approving of your fighting spirit.",
        reward: 'damageBoost',
        breadcrumbDelta: -4,
      },
      {
        label: 'Grab the blue one',
        outcome:
          'The blue orb is cool to the touch and hums with restorative energy. Gerald nods. *"HONK."* That\'s Gerald for "wise choice."',
        reward: 'hpPotion',
        breadcrumbDelta: 3,
      },
      {
        label: 'Grab all three at once',
        outcome:
          'You lunge for all three. They collide in your wings and merge into a swirling sphere of mist. Gerald honks approvingly — *"HONK!"* — this was the real treasure. A **Fog Bomb**, condensed from the storm itself.',
        reward: 'fogBomb',
        xpDelta: 10,
      },
    ],
  },
  {
    id: 'harold_stare',
    type: 'npc',
    location: 'parkBench',
    narrative:
      '**Harold** the old man reaches into his coat pocket. He pulls out a piece of bread. He tears it slowly. Deliberately. He holds a piece toward you.\n\nHis eyes say: *"Take it. But know this changes nothing between us."*',
    choices: [
      {
        label: 'Take the bread gratefully',
        outcome:
          'You take the bread. Harold nods once. The bread is enchanted — it radiates warmth and smells like victory.',
        reward: 'hpPotion',
      },
      {
        label: 'Sit next to Harold in silence',
        outcome:
          'You sit. Minutes pass. Harold does not move. You do not move. Eventually, a golden feather drifts down from somewhere. Harold seems satisfied.',
        reward: 'shieldToken',
      },
      {
        label: 'Do a little dance for Harold',
        outcome:
          "You dance your best duck dance. Harold's expression does not change. But a single tear rolls down his cheek. He hands you his special bread.",
        reward: 'damageBoost',
      },
    ],
  },
  {
    id: 'harold_chess',
    type: 'npc',
    location: 'parkBench',
    narrative:
      '**Harold** has set up a chessboard on the park bench. He does not look up as you approach. The pieces are breadcrumbs — white sourdough vs dark rye.\n\nHe pushes a pawn forward. It is your move. Harold has been waiting.',
    choices: [
      {
        label: "Play Harold's game",
        outcome:
          'You play for forty minutes. Harold wins in six moves, somehow. The remaining thirty-four minutes were him waiting for you to realize it. He slides a potion across the board. *"For trying."*',
        reward: 'hpPotion',
        breadcrumbDelta: 2,
        xpDelta: 5,
      },
      {
        label: 'Flip the board',
        outcome:
          'Breadcrumbs scatter everywhere. Harold blinks. For the first time in recorded history, his expression changes — the faintest hint of a smile. He reaches into his coat and hands you something. *"Bold."*',
        reward: 'damageBoost',
        breadcrumbDelta: -5,
      },
      {
        label: 'Eat one of the chess pieces',
        outcome:
          "You eat the white queen. It's delicious. Harold stares at you for a long time. Then he slowly, deliberately, eats the black king. You are now bonded for life. He hands you a gift.",
        reward: 'energyDrink',
        xpDelta: 8,
      },
    ],
  },
  // --- Frostbeak (Frozen Pond NPC) ---
  {
    id: 'frostbeak_thaw',
    type: 'npc',
    location: 'frozenPond',
    narrative:
      'A duck-shaped ice sculpture stands in the center of the pond. As you approach, its eyes blink. *"Oh! A visitor! I\'m **Frostbeak** — I\'ve been frozen here for... what century is this?"*\n\nThe ice around them cracks slightly. *"I could use some help thawing out. Or you could just... talk to me. It gets lonely being a popsicle."*',
    choices: [
      {
        label: 'Help them thaw',
        outcome:
          'You chip away at the ice with your beak. Frostbeak stretches their wings for the first time in centuries. *"FREEDOM! Oh, that\'s nice. Here — take this. I\'ve been keeping it warm. ...Well, cold. Same thing."*',
        reward: 'hpPotion',
        breadcrumbDelta: 4,
      },
      {
        label: 'Ask about the century question',
        outcome:
          '*"When I froze, ducks still used swords made of breadsticks. The Coliseum hadn\'t been built. Chuck Norris was just a regular guy with slightly above-average roundhouse kicks."* They hand you an ancient artifact from beneath the ice.',
        reward: 'shieldToken',
        xpDelta: 10,
      },
      {
        label: 'Lick the ice',
        outcome:
          "Your tongue gets stuck. Frostbeak laughs — the first warmth they've felt in ages. The ice cracks and a strange magnetic device tumbles free. *\"That's been stuck in there since the Third Age. Take it — it attracts breadcrumbs like you wouldn't believe.\"*",
        reward: 'breadcrumbMagnet',
        breadcrumbDelta: -4,
      },
    ],
  },
  {
    id: 'frostbeak_memories',
    type: 'lore',
    location: 'frozenPond',
    narrative:
      '**Frostbeak** sits on a (slightly melted) ice throne, gazing at the frozen horizon. *"You know, I remember the First Quacktament. Before the classes. Before the chaos events. It was just... ducks hitting each other with bread."*\n\nThey sigh wistfully. *"Simpler times."*',
    choices: [
      {
        label: 'Ask about the First Quacktament',
        outcome:
          '*"The first champion was a duck named \'Crumbles.\' Won with nothing but a stale baguette and an attitude problem."* Frostbeak hands you a relic — a piece of that very baguette, preserved in ice.',
        reward: 'damageBoost',
      },
      {
        label: 'Share a warm breadcrumb',
        outcome:
          'You offer a breadcrumb. Frostbeak holds it like it\'s the most precious thing in the world. A tear freezes on their cheek. *"Thank you. Here — it\'s dangerous to go alone."*',
        reward: 'hpPotion',
      },
    ],
  },
]

// --- Discovery Encounters ---

const DISCOVERY_ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'hidden_stash',
    type: 'discovery',
    location: 'any',
    narrative:
      'A loose breadcrumb tile shifts under your webbed foot. Beneath it: a small iron box, rusted shut and etched with a faded inscription: *"Property of Crumbles — First Champion of the Quacktament."*\n\nThe lock is ancient but the contents hum with residual arena magic. Whatever Crumbles stashed here, they meant for it to be found.',
    choices: [
      {
        label: 'Pry it open carefully',
        outcome:
          "The lid creaks open. Inside, wrapped in wax paper that smells like a bakery from another century: a perfectly preserved **Bread Poultice**. Crumbles' emergency supply, waiting all this time for a worthy duck.",
        reward: 'hpPotion',
        breadcrumbDelta: 3,
      },
      {
        label: 'Smash it open with your wing',
        outcome:
          "You bring your wing down HARD. The box shatters and golden crumbs scatter. Among the debris: a **Bread of Fury**, still crackling with Crumbles' legendary aggression. The first champion's fighting spirit lives on.",
        reward: 'damageBoost',
        breadcrumbDelta: -5,
      },
      {
        label: 'Check for traps first',
        outcome:
          "Smart — Crumbles was paranoid. A tiny spring-loaded breadcrumb launcher nearly takes your eye out. You disarm it and find a **Pond Water Espresso** hidden in a false bottom. Crumbles didn't just fight hard — they planned hard.",
        reward: 'energyDrink',
        xpDelta: 8,
      },
    ],
  },
  {
    id: 'wandering_vendor',
    type: 'discovery',
    location: 'any',
    narrative:
      '🧥 **Trenchbill** materializes from the shadows, trenchcoat flapping. An unlit cigarette dangles from his beak. *"Psst. You. Yeah, you. I got goods."*\n\nHe opens his coat to reveal an assortment of glowing wares. *"No refunds, no returns, no eye contact."*',
    choices: [
      {
        label: 'Browse the health section',
        outcome:
          '*"Bread Poultice. Medicinal grade. Fell off a wagon."* Trenchbill hands you a neatly wrapped compress. His trenchcoat rustles ominously.',
        reward: 'hpPotion',
      },
      {
        label: 'Ask for the good stuff',
        outcome:
          "Trenchbill looks both ways. Then up. Then down. *\"Chuck's Feather Token. Don't ask how I got it. Don't tell Chuck.\"* He wraps it in old newspaper.",
        reward: 'shieldToken',
      },
      {
        label: 'Haggle aggressively',
        outcome:
          'After a heated negotiation involving bread futures and feather derivatives, Trenchbill concedes. *"Fine. Pond Water Espresso. Triple-distilled. My personal stash."* He looks genuinely pained.',
        reward: 'energyDrink',
      },
    ],
  },
  {
    id: 'training_dummy',
    type: 'discovery',
    location: 'coliseum',
    narrative:
      'In a shadowed alcove of the Coliseum stands **Old Ironsides** — a battle-scarred training dummy built from petrified breadcrumbs and rusted arena chain. Unlike Practice Dummy #47 by the gates, Old Ironsides has *history*. Deep gouges from Mallard Norris roundhouses. Acid burns from Dr. Quackenstein\'s earliest plague experiments. A chunk missing from its shoulder where, legend says, Chuck Norris once sneezed in its general direction.\n\nA faded plaque reads: *"I have trained champions. I have outlasted them all."*\n\nSomething glints behind its battered frame.',
    choices: [
      {
        label: 'Strike it with respect',
        outcome:
          "You deliver a clean hit. Old Ironsides absorbs the blow without flinching — it has taken worse. A hidden compartment clicks open in its chest, revealing a **Bread of Fury** worn smooth by generations of warriors. You've earned it.",
        reward: 'damageBoost',
        breadcrumbDelta: -3,
      },
      {
        label: 'Salute and hold your ground',
        outcome:
          "You raise your wing in a warrior's salute. Old Ironsides does not move. It never moves. But a golden feather drifts down from a crack in the ceiling above — as if the Coliseum itself rewards your discipline.",
        reward: 'shieldToken',
        breadcrumbDelta: 3,
      },
      {
        label: 'Investigate behind it',
        outcome:
          'You squeeze behind Old Ironsides and find a dusty **Pond Water Espresso** wedged in a crack. The label reads *"Best before 1847."* It\'s probably fine. Old Ironsides has been guarding it all this time.',
        reward: 'energyDrink',
        xpDelta: 5,
      },
    ],
  },
]

// --- Lore Encounters ---

const LORE_ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'chuck_norris_fact',
    type: 'lore',
    location: 'any',
    narrative:
      'A stone tablet emerges from the ground. Inscribed upon it is an ancient **Chuck Norris Fact**:\n\n*"Chuck Norris once roundhouse kicked a duck so hard it evolved into a swan. The swan was immediately disqualified from the Quacktament."*\n\nYou feel inspired by this knowledge.',
    choices: [
      {
        label: 'Meditate on the wisdom',
        outcome:
          'You sit cross-legged before the tablet and close your eyes. The Chuck Norris Fact reverberates through your being. When you open your eyes, hours have passed — and a **Pond Water Espresso** has materialized beside you, condensed from pure concentrated inspiration.',
        reward: 'energyDrink',
        xpDelta: 10,
      },
      {
        label: 'Try to replicate the kick',
        outcome:
          "You attempt a roundhouse kick. Your foot connects with nothing, you spin three times, and crash into the tablet. It cracks — and from inside, a **Bread of Fury** tumbles out, still radiating the heat of Chuck's original kick. Some things are meant to be found the hard way.",
        reward: 'damageBoost',
        breadcrumbDelta: -4,
      },
    ],
  },
  {
    id: 'great_mallard_vision',
    type: 'lore',
    location: 'any',
    narrative:
      'The air shimmers. For a brief moment, you see **The Great Mallard** — the cosmic duck who sneezed the universe into existence. They wink at you.\n\n*"Quack,"* they say. It means everything.',
    choices: [
      {
        label: 'Quack back',
        outcome:
          "You quack into the void. The sound echoes — not off walls, but off *time itself*. The Great Mallard nods slowly, and a golden feather materializes in your wing, warm with cosmic energy. You've been blessed by the sneeze that started everything.",
        reward: 'shieldToken',
        xpDelta: 5,
      },
      {
        label: 'Ask about the meaning of quack',
        outcome:
          'The Great Mallard tilts their head. The universe holds its breath. *"It means \'bread,\'"* they say softly. *"It has always meant bread."* A Bread Poultice appears in your wings, still warm from the beginning of time. The Mallard fades, leaving behind the faint scent of sourdough.',
        reward: 'hpPotion',
        xpDelta: 5,
      },
    ],
  },
  {
    id: 'arena_history',
    type: 'lore',
    location: 'coliseum',
    narrative:
      'You find an old mural depicting the **First Quacktament**. The ducks in the painting are using breadsticks as swords. One duck — labeled *"The Original Mallard Norris"* — is roundhouse kicking three opponents simultaneously.\n\nA plaque reads: *"In the beginning, there was bread. And then there was violence."*',
    choices: [
      {
        label: 'Pay respects',
        outcome:
          'You bow low before the mural. The painted eyes of the Original Mallard Norris seem to glow. A warm breeze sweeps through the corridor and a **Bread Poultice** slides from behind the frame, wrapped in ancient linen. The inscription on the wrapper reads: *"For those who remember."*',
        reward: 'hpPotion',
        xpDelta: 5,
      },
      {
        label: 'Take a selfie with the mural',
        outcome:
          "The flash disturbs a sleeping bat-duck behind the mural. It shrieks, drops an energy drink, and crashes into the painting — revealing a hidden **Mirror Shard** embedded in the wall behind the Original Mallard's roundhouse kick. The bat-duck is fine. Probably.",
        reward: 'mirrorShard',
      },
    ],
  },
  {
    id: 'attenbird_documentary',
    type: 'lore',
    location: 'any',
    narrative:
      'A distinguished-looking duck in a tweed jacket and tiny monocle appears, flanked by an invisible camera crew.\n\n*"Ah, the remarkable Quacktament participant,"* whispers **Sir David Attenbird**. *"Observe how it navigates its environment with a mixture of confidence and mild confusion. Truly fascinating."*\n\nHe turns to you directly. *"Would you mind terribly if I documented your journey? For science, of course."*',
    choices: [
      {
        label: 'Strike a heroic pose',
        outcome:
          '*"Magnificent. The way the light catches your plumage... exquisite."* Sir David Attenbird hands you a signed copy of his book, *"The Breadcrumb Diaries."* Inside the cover: a hidden potion.',
        reward: 'hpPotion',
      },
      {
        label: 'Ask him about the Quackverse',
        outcome:
          '*"The Quackverse is, in essence, what happens when an omnipotent duck sneezes. Every pond, every breadcrumb — all connected by threads of quacking."* He gives you a research stipend (it\'s an energy drink).',
        reward: 'energyDrink',
      },
      {
        label: 'Attempt to narrate HIM',
        outcome:
          '*"And here we see the rare Sir David Attenbird, startled by his own reflection..."* He laughs so hard his monocle pops off. *"Well played."* He hands you a token of respect.',
        reward: 'damageBoost',
      },
    ],
  },
]

// --- Tutorial Encounter ---

export const TUTORIAL_ENCOUNTER: EncounterDefinition = {
  id: 'tutorial_basics',
  type: 'discovery',
  location: 'coliseum',
  narrative:
    'A battered straw dummy wobbles toward you on a rusty spring. Someone has painted angry eyes on its burlap face and scrawled **"Practice Dummy #47"** across its chest in breadcrumb paste. A tally of scratches covers its torso — each one a combatant who came before you.\n\nIt squeaks to a halt. Straw pokes out of a dozen old wounds. A faded ribbon pinned to its shoulder reads: *"Employee of the Month — 37 months running."*\n\nDummy #47 stares at you with its painted eyes, practically daring you to take a swing.',
  choices: [
    {
      label: 'Give it a light bonk',
      outcome:
        'You bonk the dummy square in the face. It spins like a top, creaks to a stop, and a hidden compartment pops open in its chest. Inside: a **Bread Poultice**, carefully wrapped in old newspaper. Dummy #47 has been hoarding supplies.\n\nThe dummy wobbles back upright, seemingly satisfied. Another tally mark appears on its torso. You could swear it just winked.',
      reward: 'hpPotion',
    },
    {
      label: 'Lean in and whisper to it',
      outcome:
        'You lean close. The dummy\'s painted mouth seems to curve ever so slightly. From somewhere deep inside its straw body, a tinny voice crackles: *"The secret... is to never stop quacking."*\n\nA small **Bread Poultice** rolls out from a hole in its base, as if offered by an old friend. Dummy #47 has seen a thousand warriors. It knows things.',
      reward: 'hpPotion',
    },
    {
      label: 'Challenge it to a duel',
      outcome:
        "You square up. Dummy #47 does not flinch. The straw rustles in a breeze that shouldn't exist indoors. You charge — the dummy doesn't move. You win. Obviously.\n\nBut as you turn away, something clatters to the floor behind you. A **Bread Poultice** has fallen from Dummy #47's shoulder ribbon. A gift from a veteran who has never won a single fight — and never once complained.",
      reward: 'hpPotion',
    },
  ],
}

// --- Breadcrumb Vault Encounters ---

const VAULT_ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'vault_guardian',
    type: 'npc',
    location: 'breadcrumbVault',
    narrative:
      'A massive breadcrumb golem blocks your path. Its eyes glow with ancient accounting magic. Carved into its chest: *"BALANCE THE LEDGER."*\n\nIt raises a fist made of compressed sourdough.',
    choices: [
      {
        label: 'Fight it with financial literacy',
        outcome:
          'You shout depreciation schedules at the golem until it crumbles. Inside: a rare **Bread of Fury** stamped with the Duchess\'s seal. *"Approved."*',
        reward: 'damageBoost',
        breadcrumbDelta: -6,
      },
      {
        label: 'Offer a breadcrumb as tribute',
        outcome:
          'The golem inspects your breadcrumb, nods solemnly, and steps aside. Behind it: a **Bread Poultice** wrapped in gold leaf. Premium healthcare.',
        reward: 'hpPotion',
        breadcrumbDelta: 3,
      },
      {
        label: 'Sneak past while it counts',
        outcome:
          'The golem is muttering "...four hundred and twelve... four hundred and thirteen..." You tiptoe past and find a **Breadcrumb Magnet** humming in an open vault drawer. No wonder the Duchess is so rich.',
        reward: 'breadcrumbMagnet',
        xpDelta: 8,
      },
    ],
  },
  {
    id: 'vault_heist',
    type: 'discovery',
    location: 'breadcrumbVault',
    narrative:
      'Deep in the Vault, you find a room labeled *"EMERGENCY RESERVES — DO NOT EAT."* The breadcrumbs here are enormous — the size of your head. One of them is glowing.\n\nA sign reads: *"Authorized personnel only. If you can read this, you\'re probably not authorized."*',
    choices: [
      {
        label: 'Take the glowing one',
        outcome:
          "You grab the glowing breadcrumb. It pulses with power — a **Bread of Fury** forged from the Duchess's personal reserve. The alarm doesn't go off. Probably.",
        reward: 'damageBoost',
        breadcrumbDelta: -7,
      },
      {
        label: 'Read the fine print',
        outcome:
          'You lean in to read the microscopic text: *"Any duck reading this is hereby entitled to one (1) complimentary beverage."* A **Pond Water Espresso** materializes.',
        reward: 'energyDrink',
        breadcrumbDelta: 2,
      },
    ],
  },
  {
    id: 'vault_accountant',
    type: 'lore',
    location: 'breadcrumbVault',
    narrative:
      'A ghostly duck in spectacles hovers over a ledger, muttering numbers. *"The Duchess\'s fortune... thirty-seven million crumbs... adjusted for inflation... carry the two..."*\n\nIt notices you. *"Oh! A living duck! Quick — can you verify this entry? I\'ve been dead for two hundred years and I\'ve lost count."*',
    choices: [
      {
        label: 'Help with the math',
        outcome:
          'You spend an hour doing ghost-accounting. The spectral duck weeps with joy. *"FINALLY! The books balance! Take this — I don\'t need it anymore."* A **Shield Token** appears.',
        reward: 'shieldToken',
      },
      {
        label: 'Tell him the Duchess went bankrupt',
        outcome:
          'The ghost screams, drops everything, and vanishes through the floor. A **Bread Poultice** falls from the scattered papers. That was mean, but effective.',
        reward: 'hpPotion',
      },
    ],
  },
  {
    id: 'vault_safe',
    type: 'discovery',
    location: 'breadcrumbVault',
    narrative:
      'Behind a golden loaf sculpture, you discover a hidden safe. The combination lock has breadcrumb-shaped dials. A faded note reads: *"Combination: The Duchess\'s birthday. (No one knows the Duchess\'s birthday.)"*',
    choices: [
      {
        label: 'Guess randomly',
        outcome:
          'You spin the dials. Click. Click. CLICK. It opens! Inside: a pristine **Bread of Fury** and a note: *"Happy birthday to me. —D.F."* You got lucky.',
        reward: 'damageBoost',
      },
      {
        label: 'Pry it open with brute force',
        outcome:
          'You wedge your beak in and HEAVE. The safe pops open with a satisfying crunch. Inside: a **Pond Water Espresso** in a diamond-encrusted thermos. The Duchess lives well.',
        reward: 'energyDrink',
      },
      {
        label: 'Ask the ghost accountant',
        outcome:
          'The ghost materializes, adjusts his spectacles. *"March 14th. Breadcrumb Day. Obviously."* The safe opens. A **Shield Token** glows inside.',
        reward: 'shieldToken',
      },
    ],
  },
]

// --- Great Nest Encounters ---

const NEST_ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'nest_echoes',
    type: 'lore',
    location: 'greatNest',
    narrative:
      'Golden feathers drift like snow. As you wade deeper into **The Great Nest**, voices echo from the woven walls — every duck who ever lived, whispering fragments of memory.\n\nOne voice grows louder: *"Find it. The feather that started everything. It\'s here. It was always here."*',
    choices: [
      {
        label: 'Follow the voice',
        outcome:
          "You push through curtains of ancient feathers until you find it — a single golden plume embedded in the nest's heart. Touching it fills you with power. A **Bread of Fury** crystallizes in your wing.",
        reward: 'damageBoost',
      },
      {
        label: 'Listen to all the voices',
        outcome:
          'You stand still and let the chorus wash over you. Names, battles, breadcrumbs won and lost. The knowledge heals something deep inside. A **Bread Poultice** appears, warm and ancient.',
        reward: 'hpPotion',
      },
    ],
  },
  {
    id: 'nest_guardian_spirit',
    type: 'npc',
    location: 'greatNest',
    narrative:
      'A translucent duck materializes before you — enormous, regal, and slightly annoyed. *"I am the Guardian of the Nest. Every century, some fool wanders in here looking for power."*\n\nIt sighs. *"Fine. Prove you deserve to be here."*',
    choices: [
      {
        label: 'Challenge the Guardian',
        outcome:
          'You square up. The Guardian charges — and passes right through you. It\'s a ghost. *"Oh. Right. I\'m dead."* It shrugs and fades away. No loot — but the courage it took leaves a mark on your spirit.',
        xpDelta: 20,
      },
      {
        label: 'Offer a breadcrumb in tribute',
        outcome:
          "The Guardian's eyes widen. *\"A breadcrumb?! Do you know how long it's been since I've eaten?! ...Two thousand years. The answer is two thousand years.\"* It grants you a **Pond Water Espresso** in gratitude.",
        reward: 'energyDrink',
        breadcrumbDelta: 4,
      },
      {
        label: 'Tell a joke',
        outcome:
          '"Why did the duck cross the Nest? To get to the other side quest." The Guardian stares. Then HOWLS with laughter. *"THAT\'S TERRIBLE! I love it!"* A **Bread of Fury** materializes.',
        reward: 'damageBoost',
        xpDelta: 10,
      },
    ],
  },
  {
    id: 'nest_egg_chamber',
    type: 'discovery',
    location: 'greatNest',
    narrative:
      'You enter a chamber lined with enormous eggs — six of them, each a different color. One pedestal stands empty. A plaque reads: *"Six eggs hatched. One did not. Six stories ended. One continues."*\n\nThe empty pedestal hums with residual power.',
    choices: [
      {
        label: 'Touch the empty pedestal',
        outcome:
          'Power surges through you. For a moment, you see the Seventh Egg — golden, pulsing, alive. The vision fades but leaves behind a **Shield Token** forged from ancient shell fragments.',
        reward: 'shieldToken',
        breadcrumbDelta: 3,
      },
      {
        label: 'Examine the hatched eggs',
        outcome:
          'Each shell contains a fragment of history. Inside one, wrapped in ancient feathers: a **Bread Poultice** from before the First Quacktament. It still works.',
        reward: 'hpPotion',
      },
      {
        label: 'Search for hidden passages',
        outcome:
          'Behind the sixth egg, a narrow tunnel leads to a hidden alcove. Inside: a **Quack Grenade** forged from golden eggshell. It hums with primal destructive energy — the kind that ended the Second Age.',
        reward: 'quackGrenade',
        breadcrumbDelta: -5,
      },
    ],
  },
  {
    id: 'nest_ancient_mural',
    type: 'lore',
    location: 'greatNest',
    narrative:
      'A massive mural stretches across the Nest wall, depicting **The Great Mallard** mid-sneeze — the moment the Quackverse was born. In the painting, seven eggs orbit the Mallard. Six glow. One is dark.\n\nBelow: *"When the Seventh awakens, the Quackverse will remember what it forgot."*',
    choices: [
      {
        label: 'Touch the dark egg in the mural',
        outcome:
          'The painted egg glows briefly. A **Pond Water Espresso** falls from the wall — condensed from pure primordial Quackverse energy. It tastes like eternity.',
        reward: 'energyDrink',
      },
      {
        label: "Trace the Mallard's outline",
        outcome:
          "Your wing follows the divine sneeze. The wall trembles and a shard of the mural's surface peels away — it's a **Mirror Shard**, reflecting not your face but the face of every duck who ever stood here. Ancient protection magic.",
        reward: 'mirrorShard',
      },
    ],
  },
]

// --- Quest-Specific Encounters ---

const QUEST_ENCOUNTERS: EncounterDefinition[] = [
  {
    id: 'quest_riddle_1',
    type: 'npc',
    location: 'quackatoa',
    questTrigger: { questId: 'bigmouth_riddles', stepId: 'riddles' },
    narrative:
      '**Big Mouth McGee** erupts from the lava, steam hissing from his beak. *"RIDDLE THE FIRST!"*\n\n' +
      'He clears his throat dramatically.\n\n' +
      '*"What has feathers but can\'t fly, swims but has no fins?"*',
    choices: [
      {
        label: 'A rubber duck!',
        outcome:
          '*McGee\'s jaw drops.* "CORRECT! A RUBBER DUCK! Feathers painted on, no fins, ' +
          'just vibes and buoyancy!" He tosses you a glowing breadcrumb. *"One down, two to go!"*',
        xpDelta: 15,
      },
      {
        label: 'A penguin?',
        outcome:
          '*McGee slaps the lava in frustration.* "A PENGUIN?! Penguins have fins! ' +
          'Those little flipper things! DISQUALIFIED!" He dives under and resurfaces. ' +
          '*"Try again next time, featherbrain!"*',
        breadcrumbDelta: -5,
      },
      {
        label: 'McGee himself?',
        outcome:
          '*McGee pauses. His eyes narrow. Then he HOWLS with laughter.* ' +
          '"ME?! I can FLY! ...Theoretically! The lava makes it complicated!" ' +
          'He wipes a tear and tosses you a small reward. *"Points for cheek."*',
        xpDelta: 8,
      },
    ],
  },
  {
    id: 'quest_riddle_2',
    type: 'npc',
    location: 'quackatoa',
    questTrigger: { questId: 'bigmouth_riddles', stepId: 'riddles' },
    narrative:
      '**Big Mouth McGee** rises again, volcanic bubbles popping around his enormous beak.\n\n' +
      '*"RIDDLE THE SECOND! Pay attention!"*\n\n' +
      '*"What falls but never breaks, and breaks but never falls?"*',
    choices: [
      {
        label: 'Night and day!',
        outcome:
          '*McGee clutches his chest.* "NIGHT FALLS! DAY BREAKS! ' +
          'You absolute GENIUS of a duck!" Lava geysers erupt in celebration. ' +
          '*"Two down! The final riddle awaits!"*',
        xpDelta: 15,
      },
      {
        label: 'Waterfall and dawn?',
        outcome:
          '*McGee tilts his head.* "A waterfall DOES fall... and dawn DOES break... ' +
          'but that\'s TWO THINGS not two HALVES of the same answer!" ' +
          'He begrudgingly nods. *"Close enough for a pelican\'s standards."*',
        xpDelta: 10,
      },
      {
        label: 'My spirit after this riddle?',
        outcome:
          '*McGee stares at you. A single volcanic tear rolls down his beak.* ' +
          '"That\'s... that\'s the most relatable thing anyone has ever said to me." ' +
          'He hands you a warm breadcrumb. *"I feel SEEN."*',
        xpDelta: 8,
        reward: 'hpPotion',
      },
    ],
  },
  {
    id: 'quest_riddle_3',
    type: 'npc',
    location: 'quackatoa',
    questTrigger: { questId: 'bigmouth_riddles', stepId: 'riddles' },
    narrative:
      '**Big Mouth McGee** surfaces one final time, wreathed in volcanic smoke.\n\n' +
      '*"THE FINAL RIDDLE! This one separates the ducks from the ducklings!"*\n\n' +
      '*"I speak without a mouth and hear without ears. What am I?"*',
    choices: [
      {
        label: 'An echo!',
        outcome:
          "*McGee's beak falls open. He looks genuinely impressed.* " +
          '"An ECHO! Speaks without a mouth! Hears without ears! ' +
          'You... you actually solved all three." He reaches into his pouch ' +
          'and produces a glowing feather token. *"You\'ve EARNED this."*',
        xpDelta: 20,
        reward: 'shieldToken',
      },
      {
        label: "Gerald's HONK!",
        outcome:
          '*McGee considers this.* "Gerald\'s honk DOES echo through the ' +
          'thunderclouds... and it DOES seem to hear everything..." He nods slowly. ' +
          '*"Not the answer I was looking for, but I respect the lateral thinking."*',
        xpDelta: 12,
      },
      {
        label: 'This bot?',
        outcome:
          '*McGee squints.* "What\'s a bot?" He looks around nervously. ' +
          '*"Are you having a PHILOSOPHICAL CRISIS in my volcano?!"* ' +
          'He tosses you a breadcrumb to snap you out of it.',
        xpDelta: 5,
        reward: 'energyDrink',
      },
    ],
  },
  {
    id: 'quest_harold_chess',
    type: 'npc',
    location: 'parkBench',
    questTrigger: { questId: 'harold_chess', stepId: 'chess_play' },
    narrative:
      '**Harold** sits across from you. The chessboard is set. The pieces are breadcrumbs — ' +
      'white sourdough vs dark rye. Harold has been waiting for this moment. ' +
      'Possibly for decades.\n\n' +
      'The park is silent. A pigeon watches from a nearby tree. ' +
      'Even the wind holds its breath.\n\n' +
      '*It is your move.*',
    choices: [
      {
        label: "Open with the King's Crumbit",
        outcome:
          'You advance your king-side crumb two squares. Harold studies the board for eleven minutes. ' +
          'Then he moves a rye pawn one square forward. Twenty-three moves later, Harold wins. ' +
          'He always wins. But his eyes say something new: *respect.*\n\n' +
          'He slides a bread poultice across the board. For the journey ahead.',
        reward: 'hpPotion',
        xpDelta: 15,
      },
      {
        label: "Mirror Harold's opening move",
        outcome:
          "You copy Harold's pawn push exactly. He raises an eyebrow — " +
          'the most emotion he has displayed in thirty years. The game becomes a mirror match. ' +
          'Move for move, crumb for crumb. Harold wins on move forty-one with a technique ' +
          "that shouldn't be possible with breadcrumbs.\n\n" +
          'He nods once. A golden feather drifts from his coat.',
        reward: 'shieldToken',
        xpDelta: 15,
      },
      {
        label: 'Knock the board over and run',
        outcome:
          'Breadcrumbs scatter across the bench. Harold freezes. The pigeon gasps. ' +
          'You bolt three steps before guilt stops you.\n\n' +
          'When you turn back, Harold is calmly resetting the pieces. ' +
          'He does not look up. But on the bench where you sat: an energy drink ' +
          'and a note that reads simply: *"Coward. But an honest one."*',
        reward: 'energyDrink',
        xpDelta: 10,
      },
    ],
  },
  {
    id: 'quest_thundercloud_manuscript',
    type: 'discovery',
    location: 'highway',
    questTrigger: { questId: 'frozen_prophecy', stepId: 'manuscript' },
    narrative:
      'Gerald banks hard into a thundercloud. Lightning crackles. And there — ' +
      'etched into the underside of a massive goose wing-shaped cloud formation — ' +
      'you see it: **ancient text**, glowing faintly with residual Quackverse magic.\n\n' +
      'The **Thundercloud Manuscript**. Frostbeak was right. The migration routes ' +
      'hold secrets older than the Coliseum itself.\n\n' +
      'The symbols shimmer and shift. You need to capture them before the storm passes.',
    choices: [
      {
        label: 'Read it carefully',
        outcome:
          'You hover in the storm, eyes tracing every glyph. The ancient Old Quack script ' +
          'burns itself into your memory — migration routes, star patterns, and a single ' +
          'phrase repeated seven times: *"The egg that waits."*\n\n' +
          'The scroll materializes in your wing, warm despite the freezing rain. ' +
          'Gerald honks approvingly. *Knowledge is its own reward — but you also find a potion.*',
        reward: 'hpPotion',
        xpDelta: 20,
      },
      {
        label: 'Trace the symbols',
        outcome:
          'You extend your wing and trace each symbol in the air. Where your feathers pass, ' +
          'the glyphs solidify into golden light. The manuscript assembles itself ' +
          'piece by piece — a map of the ancient migration, leading to something called ' +
          '*"The Great Nest."*\n\n' +
          'A golden feather crystallizes from the storm. The manuscript chose you.',
        reward: 'shieldToken',
        xpDelta: 20,
      },
      {
        label: 'Take a rubbing with breadcrumbs',
        outcome:
          'You press a breadcrumb against the cloud surface and rub. Somehow, impossibly, ' +
          'the ancient text transfers onto the bread. You now hold the only breadcrumb ' +
          'in existence that is also a historical document.\n\n' +
          'Gerald stares at the bread-manuscript. He honks twice. That means *"impressive."*',
        reward: 'damageBoost',
        xpDelta: 20,
      },
    ],
  },
]

// --- Encounter Engine ---

const ALL_ENCOUNTERS = [
  ...NPC_ENCOUNTERS,
  ...DISCOVERY_ENCOUNTERS,
  ...LORE_ENCOUNTERS,
  ...VAULT_ENCOUNTERS,
  ...NEST_ENCOUNTERS,
  ...QUEST_ENCOUNTERS,
]

export const rollEncounter = (
  locationId: LocationId,
  completedIds: string[],
  activeQuestSteps?: { questId: string; stepId: string }[]
): EncounterDefinition | undefined => {
  // 0. If player has active quest steps, check for matching quest-specific encounters first
  if (activeQuestSteps && activeQuestSteps.length > 0) {
    const questMatches = QUEST_ENCOUNTERS.filter(
      (e) =>
        (e.location === locationId || e.location === 'any') &&
        e.questTrigger &&
        activeQuestSteps.some((qs) => qs.questId === e.questTrigger!.questId && qs.stepId === e.questTrigger!.stepId) &&
        !completedIds.includes(e.id)
    )
    if (questMatches.length > 0) {
      return pick(questMatches)
    }
  }

  // 1. Try fresh non-quest encounters at this location (including 'any' encounters)
  const available = ALL_ENCOUNTERS.filter(
    (e) => (e.location === locationId || e.location === 'any') && !completedIds.includes(e.id) && !e.questTrigger
  )
  if (available.length > 0) {
    return pick(available)
  }

  // 2. Try fresh 'any'-location non-quest encounters only
  const anyFresh = ALL_ENCOUNTERS.filter((e) => e.location === 'any' && !completedIds.includes(e.id) && !e.questTrigger)
  if (anyFresh.length > 0) {
    return pick(anyFresh)
  }

  // 3. Recycle: allow replaying location-specific non-quest encounters (player already saw them)
  const locationPool = ALL_ENCOUNTERS.filter(
    (e) => (e.location === locationId || e.location === 'any') && !e.questTrigger
  )
  if (locationPool.length > 0) {
    return pick(locationPool)
  }

  return undefined
}

export const resolveEncounterChoice = (
  encounter: EncounterDefinition,
  choiceIndex: number
): EncounterChoice | undefined => {
  if (choiceIndex < 1 || choiceIndex > encounter.choices.length) {
    return undefined
  }
  return encounter.choices[choiceIndex - 1]
}

export const getEncounterById = (id: string): EncounterDefinition | undefined => {
  if (id === TUTORIAL_ENCOUNTER.id) {
    return TUTORIAL_ENCOUNTER
  }
  return ALL_ENCOUNTERS.find((e) => e.id === id)
}

export const formatEncounter = (encounter: EncounterDefinition): string => {
  const choiceList = encounter.choices.map((c, i) => `**${i + 1}.** ${c.label}`).join('\n')
  return `${encounter.narrative}\n\n${choiceList}`
}
