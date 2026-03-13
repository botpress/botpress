import type { LocationId } from './locations'
import type { NpcId } from './npcs'

// --- Quest Types ---

export type QuestObjectiveType =
  | 'talkToNpc'
  | 'visitLocation'
  | 'completeEncounter'
  | 'winTournament'
  | 'collectItem'
  | 'reachLevel'
  | 'spendBreadcrumbs'
  | 'defeatInTournament'

export type QuestObjective = {
  id: string
  description: string
  type: QuestObjectiveType
  target?: string
  count: number
}

export type QuestReward = {
  type: 'xp' | 'item' | 'breadcrumbs' | 'title' | 'locationUnlock'
  value: string | number
  quantity?: number
}

export type QuestChoice = {
  label: string
  nextStepId: string
  narrative: string
  rewards?: QuestReward[]
}

export type QuestStep = {
  id: string
  description: string
  objectives: QuestObjective[]
  dialogueOnStart?: string
  dialogueOnComplete?: string
  choices?: QuestChoice[]
}

export type QuestCategory = 'main' | 'side' | 'daily'

export type QuestDefinition = {
  id: string
  name: string
  emoji: string
  category: QuestCategory
  description: string
  giverNpc: NpcId
  giverLocation: LocationId
  levelRequired: number
  prerequisiteQuestIds: string[]
  requiresChoiceMade?: { questId: string; choiceLabel: string }
  steps: QuestStep[]
  rewards: QuestReward[]
  repeatable: boolean
  cooldownHours?: number
}

export type QuestProgress = {
  questId: string
  currentStepId: string
  objectiveProgress: Record<string, number>
  startedAt: string
  choicesMade: string[]
}

export type CompletedQuest = {
  questId: string
  completedAt: string
  choicesMade: string[]
}

// --- Main Quest Chains ---

const MAIN_QUESTS: QuestDefinition[] = [
  {
    id: 'duchess_favor',
    name: "The Duchess's Favor",
    emoji: '👑',
    category: 'main',
    description:
      'Duchess Featherington has a problem. Chad Gullsworth stole her prized monocle case. Recover it and earn standing in the Coliseum.',
    giverNpc: 'duchess',
    giverLocation: 'coliseum',
    levelRequired: 2,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'audience',
        description: 'Speak with Duchess Featherington at the Coliseum',
        objectives: [
          { id: 'talk_duchess', description: 'Talk to the Duchess', type: 'talkToNpc', target: 'duchess', count: 1 },
        ],
        dialogueOnStart:
          '*The Duchess fixes you with a calculating stare.* "You want standing in this arena? Then prove you\'re not just another breadcrumb. That WRETCHED seagull — Chad Gullsworth — stole my monocle case. Retrieve it and we\'ll talk."',
        dialogueOnComplete:
          '"Well? What are you waiting for? The Puddle of Doom. That\'s where the feathered delinquent lurks."',
      },
      {
        id: 'confront_chad',
        description: 'Travel to the Puddle of Doom and confront Chad',
        objectives: [
          {
            id: 'visit_puddle',
            description: 'Travel to the Puddle',
            type: 'visitLocation',
            target: 'puddle',
            count: 1,
          },
          { id: 'talk_chad', description: 'Talk to Chad', type: 'talkToNpc', target: 'chad', count: 1 },
        ],
        dialogueOnStart:
          '*Chad spots you from atop the Honda Civic.* "THE MONOCLE CASE? I found it FAIR AND SQUARE! In her purse! While she wasn\'t looking! That\'s basically the same as finding it on the ground!"',
        dialogueOnComplete:
          '"Look, I\'ll TRADE you for it. Bring me something good from around here. I\'m a duck of REFINED TASTE."',
      },
      {
        id: 'trade_goods',
        description: "Complete 2 encounters at the Puddle to find something for Chad's trade",
        objectives: [
          {
            id: 'puddle_encounters',
            description: 'Complete 2 encounters at the Puddle',
            type: 'completeEncounter',
            target: 'puddle',
            count: 2,
          },
        ],
        dialogueOnComplete:
          "\"OHHH SHINY! Yeah okay fine, that'll do. Here's your stupid monocle case. Tell the Duchess I said... actually, don't tell her anything.\"",
      },
      {
        id: 'return_case',
        description: 'Return the monocle case to the Duchess at the Coliseum',
        objectives: [
          {
            id: 'return_coliseum',
            description: 'Return to the Coliseum',
            type: 'visitLocation',
            target: 'coliseum',
            count: 1,
          },
          {
            id: 'talk_duchess_return',
            description: 'Talk to the Duchess',
            type: 'talkToNpc',
            target: 'duchess',
            count: 1,
          },
        ],
        dialogueOnStart:
          '*The Duchess inspects the monocle case. Her beak wrinkles.* "It smells like parking lot. But... you retrieved it. You have earned a sliver of my respect."',
        dialogueOnComplete: "\"I'm hosting a gala tonight. The upper gallery. You're invited. ...Don't embarrass me.\"",
      },
      {
        id: 'gala_choice',
        description: "Attend the Duchess's Gala",
        objectives: [],
        dialogueOnStart: "The Duchess's Gala awaits in the upper gallery. How will you make your entrance?",
        choices: [
          {
            label: 'Attend in your finest feathers',
            nextStepId: 'complete',
            narrative:
              'You arrive looking spectacular. The Duchess introduces you to her inner circle. *"This one has potential,"* she declares. The crowd applauds. The doors to the **Breadcrumb Vault** swing open as a sign of trust.',
            rewards: [
              { type: 'title', value: 'coliseum_regular' },
              { type: 'breadcrumbs', value: 50 },
            ],
          },
          {
            label: 'Crash the party fashionably late',
            nextStepId: 'complete',
            narrative:
              'You smash through the window on Gerald\'s back. Breadcrumbs scatter. The Duchess gasps — then laughs. *"The AUDACITY! I respect it."* She tosses you a Bread of Fury. The **Breadcrumb Vault** opens for those who dare.',
            rewards: [
              { type: 'title', value: 'party_crasher' },
              { type: 'item', value: 'damageBoost', quantity: 1 },
              { type: 'breadcrumbs', value: 25 },
            ],
          },
        ],
      },
    ],
    rewards: [
      { type: 'xp', value: 150 },
      { type: 'breadcrumbs', value: 75 },
      { type: 'locationUnlock', value: 'breadcrumbVault' },
    ],
    repeatable: false,
  },
  {
    id: 'frozen_prophecy',
    name: 'The Frozen Prophecy',
    emoji: '🧊',
    category: 'main',
    description:
      'Frostbeak remembers fragments of an ancient prophecy from before the ice. A journey across the Quackverse to uncover what The Great Mallard left behind.',
    giverNpc: 'frostbeak',
    giverLocation: 'frozenPond',
    levelRequired: 3,
    prerequisiteQuestIds: ['duchess_favor'],
    steps: [
      {
        id: 'echoes',
        description: 'Speak with Frostbeak at the Frozen Pond',
        objectives: [
          { id: 'talk_frost', description: 'Talk to Frostbeak', type: 'talkToNpc', target: 'frostbeak', count: 1 },
        ],
        dialogueOnStart:
          '*Frostbeak\'s eyes glow blue.* "I was frozen during the First Quacktament. I SAW things. The Seventh Egg — it never hatched. Something sleeps inside. I can\'t remember where, but Gerald might know. He flies the ancient routes."',
      },
      {
        id: 'manuscript',
        description: 'Find the Thundercloud Manuscript on the Highway',
        objectives: [
          {
            id: 'visit_highway',
            description: 'Travel to the Highway',
            type: 'visitLocation',
            target: 'highway',
            count: 1,
          },
          {
            id: 'highway_encounter',
            description: 'Discover the Thundercloud Manuscript',
            type: 'completeEncounter',
            target: 'highway',
            count: 1,
          },
        ],
        dialogueOnComplete:
          "In the thunderclouds, you find a scroll wrapped in ancient feathers. The Migration Manuscript — written in Old Quack. You can't read it, but you know someone who can.",
      },
      {
        id: 'translation',
        description: 'Have Big Mouth McGee translate the scroll at Lake Quackatoa',
        objectives: [
          {
            id: 'visit_quackatoa',
            description: 'Travel to Quackatoa',
            type: 'visitLocation',
            target: 'quackatoa',
            count: 1,
          },
          { id: 'talk_bigmouth', description: 'Talk to McGee', type: 'talkToNpc', target: 'bigmouth', count: 1 },
        ],
        dialogueOnStart:
          '*McGee squints at the scroll.* "LET ME READ THIS... it says: \'The Seventh Egg never fully hatched. What remains sleeps in the Great Nest, beyond the Frozen Gate, guarded by silence and the one who remembers all but speaks nothing.\'"',
        dialogueOnComplete: '"The one who remembers all but speaks nothing... that sounds like HAROLD. Go find him."',
      },
      {
        id: 'harold_key',
        description: 'Visit Harold at the Park Bench',
        objectives: [
          {
            id: 'visit_park',
            description: 'Travel to the Park Bench',
            type: 'visitLocation',
            target: 'parkBench',
            count: 1,
          },
          { id: 'talk_harold', description: 'Talk to Harold', type: 'talkToNpc', target: 'harold', count: 1 },
        ],
        dialogueOnStart:
          "*Harold turns his head. For the first time in recorded history, he moves. He reaches into his coat and produces a key made of petrified bread. He places it in your wing. He says nothing. He doesn't need to.*",
      },
      {
        id: 'arena_trial',
        description: 'Win a tournament to prove your worth',
        objectives: [{ id: 'win_tournament', description: 'Win a tournament', type: 'winTournament', count: 1 }],
        dialogueOnComplete: 'The Arena acknowledges your strength. The path to the Great Nest is open.',
      },
      {
        id: 'great_nest',
        description: 'Travel to the Great Nest',
        objectives: [
          {
            id: 'visit_nest',
            description: 'Enter the Great Nest',
            type: 'visitLocation',
            target: 'greatNest',
            count: 1,
          },
        ],
        dialogueOnComplete:
          'You insert the petrified bread key. The ice cracks. The Frozen Gate opens. Beyond it: a nest so vast it fills the horizon. Golden feathers drift like snow. Something hums deep within. The Great Nest has waited a long, long time.',
      },
    ],
    rewards: [
      { type: 'xp', value: 150 },
      { type: 'breadcrumbs', value: 100 },
      { type: 'locationUnlock', value: 'greatNest' },
      { type: 'title', value: 'lorekeeper' },
    ],
    repeatable: false,
  },
  {
    id: 'trenchbill_underworld',
    name: "Trenchbill's Underworld",
    emoji: '🧥',
    category: 'main',
    description:
      'Trenchbill needs startup capital for a business expansion. Help him build his empire — but watch out for double crosses.',
    giverNpc: 'trenchbill',
    giverLocation: 'frozenPond',
    levelRequired: 4,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'proposition',
        description: 'Speak with Trenchbill at the Frozen Pond',
        objectives: [
          { id: 'talk_trench', description: 'Talk to Trenchbill', type: 'talkToNpc', target: 'trenchbill', count: 1 },
        ],
        dialogueOnStart:
          '*Trenchbill leans in close.* "I\'m expanding operations. Going LEGIT. ...Mostly legit. I need 50 breadcrumbs for startup capital. You fund me, I cut you in. Capisce?"',
      },
      {
        id: 'funding',
        description: 'Give Trenchbill 50 breadcrumbs',
        objectives: [
          {
            id: 'pay_breadcrumbs',
            description: 'Invest 50 breadcrumbs',
            type: 'spendBreadcrumbs',
            target: '50',
            count: 1,
          },
        ],
        dialogueOnComplete:
          '"Beautiful. Now I need you to pick up some... merchandise. Three locations. Don\'t open the packages."',
      },
      {
        id: 'supply_run',
        description: 'Visit 3 locations to pick up supplies',
        objectives: [
          { id: 'visit_1', description: 'Pick up at the Puddle', type: 'visitLocation', target: 'puddle', count: 1 },
          { id: 'visit_2', description: 'Pick up at Quackatoa', type: 'visitLocation', target: 'quackatoa', count: 1 },
          { id: 'visit_3', description: 'Pick up at the Highway', type: 'visitLocation', target: 'highway', count: 1 },
        ],
        dialogueOnComplete: 'All three packages secured. But on the way back, a familiar voice shouts from behind...',
      },
      {
        id: 'double_cross',
        description: 'Deal with Chad',
        objectives: [],
        dialogueOnStart:
          '*Chad swoops down.* "NICE PACKAGES! Those look EXPENSIVE! I propose a... redistribution of goods!"',
        choices: [
          {
            label: 'Fight Chad off',
            nextStepId: 'delivery',
            narrative:
              'You square up. Chad hesitates — he wasn\'t expecting resistance. "FINE! Keep your stupid packages!" He flies off in a huff, dropping a Bread of Fury in his retreat.',
            rewards: [
              { type: 'item', value: 'damageBoost', quantity: 1 },
              { type: 'breadcrumbs', value: 25 },
            ],
          },
          {
            label: 'Cut Chad in for a share',
            nextStepId: 'delivery',
            narrative:
              'You toss Chad a package. His eyes widen. "Wait... you\'re SHARING? Nobody ever SHARES with me." He\'s so moved he hands you a feather token. *"We\'re PARTNERS now!"*',
            rewards: [{ type: 'item', value: 'shieldToken', quantity: 1 }],
          },
        ],
      },
      {
        id: 'delivery',
        description: 'Deliver the packages to Trenchbill',
        objectives: [
          { id: 'return_trench', description: 'Talk to Trenchbill', type: 'talkToNpc', target: 'trenchbill', count: 1 },
        ],
        dialogueOnStart:
          '*Trenchbill inspects the packages. He nods slowly.* "Clean work. Professional. You\'re good at this." *His coat rustles with what might be pride.* "From now on, you get the FRIENDS AND FAMILY discount."',
      },
    ],
    rewards: [
      { type: 'xp', value: 150 },
      { type: 'breadcrumbs', value: 50 },
      { type: 'title', value: 'business_partner' },
    ],
    repeatable: false,
  },
  {
    id: 'seventh_egg',
    name: 'The Seventh Egg',
    emoji: '🥚',
    category: 'main',
    description:
      "The endgame. The Great Mallard's final secret lies in the Great Nest. Chuck Norris knows the truth. Are you ready?",
    giverNpc: 'frostbeak',
    giverLocation: 'frozenPond',
    levelRequired: 7,
    prerequisiteQuestIds: ['frozen_prophecy'],
    steps: [
      {
        id: 'nest_explore',
        description: 'Explore the Great Nest',
        objectives: [
          {
            id: 'nest_encounter',
            description: 'Complete an encounter in the Great Nest',
            type: 'completeEncounter',
            target: 'greatNest',
            count: 1,
          },
        ],
        dialogueOnComplete:
          'Deep in the nest, you find inscriptions on golden shells. Four names. Four locations. Four fragments.',
      },
      {
        id: 'gather_flock',
        description: 'Gather knowledge from the four elders',
        objectives: [
          { id: 'elder_duchess', description: 'Consult the Duchess', type: 'talkToNpc', target: 'duchess', count: 1 },
          { id: 'elder_frost', description: 'Consult Frostbeak', type: 'talkToNpc', target: 'frostbeak', count: 1 },
          { id: 'elder_bigmouth', description: 'Consult McGee', type: 'talkToNpc', target: 'bigmouth', count: 1 },
          { id: 'elder_harold', description: 'Consult Harold', type: 'talkToNpc', target: 'harold', count: 1 },
        ],
        dialogueOnComplete:
          'Each elder shared a fragment. Together they form a map — the Seventh Egg lies at the heart of the Great Nest. But it demands offerings.',
      },
      {
        id: 'offerings',
        description: 'Gather offerings (items will be consumed)',
        objectives: [
          {
            id: 'offer_shield',
            description: 'Obtain a Feather Token',
            type: 'collectItem',
            target: 'shieldToken',
            count: 1,
          },
          {
            id: 'offer_fury',
            description: 'Obtain a Bread of Fury',
            type: 'collectItem',
            target: 'damageBoost',
            count: 1,
          },
          {
            id: 'offer_potion',
            description: 'Obtain a Bread Poultice',
            type: 'collectItem',
            target: 'hpPotion',
            count: 1,
          },
        ],
        dialogueOnStart:
          '*The golden inscriptions glow faintly.* "The Egg demands tribute — a feather of protection, bread forged in fury, and a poultice of healing. Only the prepared may approach."',
        dialogueOnComplete:
          '*You place the offerings before the ancient nest. They dissolve into golden light. The path forward trembles open.* "The Egg accepts. But one trial remains."',
      },
      {
        id: 'trial_combat',
        description: 'Prove your worth in combat',
        objectives: [{ id: 'win_2', description: 'Win 2 tournaments', type: 'winTournament', count: 2 }],
        dialogueOnStart:
          '*A booming voice echoes through the Great Nest:* "Words and gifts are not enough. The Seventh Egg demands PROOF. Win twice in the arena, and the Egg shall reveal itself."',
        dialogueOnComplete:
          '*The arena falls silent. Two victories. The Great Nest shudders — somewhere deep within, an ancient heartbeat begins.*',
      },
      {
        id: 'the_hatching',
        description: 'Return to the Great Nest',
        objectives: [
          {
            id: 'return_nest',
            description: 'Enter the Great Nest',
            type: 'visitLocation',
            target: 'greatNest',
            count: 1,
          },
        ],
        dialogueOnComplete:
          'Chuck Norris descends from his golden nest. He removes his tiny sunglasses. For the first time ever, he speaks more than one word: *"You found it. The part of me I left behind. The Egg of Violence holds one more truth."*',
      },
      {
        id: 'egg_choice',
        description: 'Decide the fate of the Seventh Egg',
        objectives: [],
        dialogueOnStart:
          'The Seventh Egg pulses with ancient power. Chuck Norris watches. The entire Quackverse holds its breath.',
        choices: [
          {
            label: 'Hatch the Egg — unleash its power',
            nextStepId: 'epilogue',
            narrative:
              'The egg CRACKS. Light floods the Great Nest. A wave of primal energy surges through you. You feel stronger. Faster. More... duck. Chuck Norris nods. *"The violence was inside you all along."*',
            rewards: [
              { type: 'title', value: 'the_awakened' },
              { type: 'xp', value: 200 },
            ],
          },
          {
            label: 'Seal the Egg — protect the Quackverse',
            nextStepId: 'epilogue',
            narrative:
              'You place your wing on the egg. It glows, then dims. The power recedes. Chuck Norris smiles — actually smiles. *"Strength isn\'t always about power. Sometimes it\'s about knowing when not to use it."* The Quackverse sighs with relief.',
            rewards: [
              { type: 'title', value: 'the_peacekeeper' },
              { type: 'breadcrumbs', value: 200 },
            ],
          },
        ],
      },
      {
        id: 'epilogue',
        description: 'Speak with Sir David Attenbird',
        objectives: [
          { id: 'talk_attenbird', description: 'Talk to Attenbird', type: 'talkToNpc', target: 'attenbird', count: 1 },
        ],
        dialogueOnStart:
          '*Sir David Attenbird appears, visibly emotional.* "And so concludes the most remarkable journey I have ever documented. From a fledgling at the Coliseum gates to the duck who decided the fate of the Seventh Egg. Extraordinary."',
      },
    ],
    rewards: [
      { type: 'xp', value: 300 },
      { type: 'breadcrumbs', value: 150 },
    ],
    repeatable: false,
  },
]

// --- Side Quests ---

const SIDE_QUESTS: QuestDefinition[] = [
  {
    id: 'gerald_secret',
    name: "Gerald's Secret",
    emoji: '🪿',
    category: 'side',
    description: 'Gerald honked 7 times. That means something. Explore the Highway to find out what.',
    giverNpc: 'gerald',
    giverLocation: 'highway',
    levelRequired: 2,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'honks',
        description: 'Talk to Gerald on the Highway',
        objectives: [
          { id: 'talk_gerald', description: 'Talk to Gerald', type: 'talkToNpc', target: 'gerald', count: 1 },
        ],
        dialogueOnStart:
          '*Gerald honks 7 times. Seven. He circles a specific cloud formation. Something is hidden up here.*',
      },
      {
        id: 'search',
        description: 'Explore the Highway for what Gerald found',
        objectives: [
          {
            id: 'highway_enc',
            description: 'Complete an encounter on the Highway',
            type: 'completeEncounter',
            target: 'highway',
            count: 1,
          },
        ],
        dialogueOnComplete:
          'In the clouds where Gerald circled, you find a small nest containing an ancient espresso. Gerald honks approvingly. The secret was caffeine all along.',
      },
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'breadcrumbs', value: 30 },
      { type: 'item', value: 'energyDrink', quantity: 1 },
    ],
    repeatable: false,
  },
  {
    id: 'harold_chess',
    name: "Harold's Chess Tournament",
    emoji: '♟️',
    category: 'side',
    description: 'Harold has set up a chessboard. He has been waiting. Complete his challenge.',
    giverNpc: 'harold',
    giverLocation: 'parkBench',
    levelRequired: 3,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'chess_start',
        description: 'Accept the chess challenge',
        objectives: [
          { id: 'talk_harold', description: 'Talk to Harold', type: 'talkToNpc', target: 'harold', count: 1 },
        ],
        dialogueOnStart:
          '*Harold has arranged breadcrumb chess pieces on the bench. He pushes a pawn forward. It is your move.*',
      },
      {
        id: 'chess_play',
        description: "Play Harold's chess challenge at the Park Bench",
        objectives: [
          {
            id: 'park_enc',
            description: "Play Harold's chess game",
            type: 'completeEncounter',
            target: 'parkBench',
            count: 1,
          },
        ],
      },
      {
        id: 'chess_prove',
        description: 'Win a tournament (Harold is watching)',
        objectives: [{ id: 'win_for_harold', description: 'Win a tournament', type: 'winTournament', count: 1 }],
        dialogueOnComplete:
          '*Harold nods once. He slides a crumpled note across the bench. It reads: "You\'ll do." Coming from Harold, that\'s a standing ovation.*',
      },
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'breadcrumbs', value: 40 },
      { type: 'title', value: 'harolds_apprentice' },
    ],
    repeatable: false,
  },
  {
    id: 'bigmouth_riddles',
    name: "Big Mouth's Riddle Chain",
    emoji: '❓',
    category: 'side',
    description: 'McGee has a series of increasingly absurd riddles. Solve them all for a prize.',
    giverNpc: 'bigmouth',
    giverLocation: 'quackatoa',
    levelRequired: 2,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'riddle_start',
        description: 'Accept the riddle challenge',
        objectives: [
          { id: 'talk_mcgee', description: 'Talk to McGee', type: 'talkToNpc', target: 'bigmouth', count: 1 },
        ],
        dialogueOnStart:
          '*McGee rises from the lava.* "THREE RIDDLES! Answer them through the encounters of Quackatoa and the prize is YOURS!"',
      },
      {
        id: 'riddles',
        description: "Solve McGee's 3 riddles at Quackatoa",
        objectives: [
          {
            id: 'quack_encounters',
            description: "Solve McGee's riddles at Quackatoa",
            type: 'completeEncounter',
            target: 'quackatoa',
            count: 3,
          },
        ],
        dialogueOnComplete:
          "*McGee's jaw drops (literally — he's a pelican).* \"You solved them ALL?! I... I don't have a fourth riddle prepared. This has never happened before. Here. Take this. You've earned it.\"",
      },
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'breadcrumbs', value: 30 },
      { type: 'item', value: 'shieldToken', quantity: 1 },
    ],
    repeatable: false,
  },
  {
    id: 'attenbird_documentary',
    name: 'The Attenbird Documentary',
    emoji: '🎬',
    category: 'side',
    description: 'Sir David Attenbird wants to film your adventures. Visit 3 locations while he narrates.',
    giverNpc: 'attenbird',
    giverLocation: 'coliseum',
    levelRequired: 4,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'casting',
        description: 'Accept the documentary role',
        objectives: [
          { id: 'talk_attenbird', description: 'Talk to Attenbird', type: 'talkToNpc', target: 'attenbird', count: 1 },
        ],
        dialogueOnStart:
          '*Attenbird adjusts his monocle.* "I need a STAR. Someone with charisma, danger, and a complete disregard for personal safety. ...You\'ll do."',
      },
      {
        id: 'filming',
        description: 'Visit 3 different locations for filming',
        objectives: [
          { id: 'film_1', description: 'Visit the Puddle', type: 'visitLocation', target: 'puddle', count: 1 },
          { id: 'film_2', description: 'Visit Quackatoa', type: 'visitLocation', target: 'quackatoa', count: 1 },
          { id: 'film_3', description: 'Visit the Frozen Pond', type: 'visitLocation', target: 'frozenPond', count: 1 },
        ],
      },
      {
        id: 'premiere',
        description: 'Return to the Coliseum for the premiere',
        objectives: [
          {
            id: 'return_premiere',
            description: 'Return to the Coliseum',
            type: 'visitLocation',
            target: 'coliseum',
            count: 1,
          },
          { id: 'talk_premiere', description: 'Talk to Attenbird', type: 'talkToNpc', target: 'attenbird', count: 1 },
        ],
        dialogueOnComplete:
          '*The documentary premieres to a crowd of ten thousand ducks. They cheer. They cry. They throw breadcrumbs. Attenbird weeps.* "MAGNIFICENT. You, my friend, are a star."',
      },
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'breadcrumbs', value: 50 },
      { type: 'title', value: 'documentary_star' },
    ],
    repeatable: false,
  },
  {
    id: 'frostbeak_memories',
    name: "Frostbeak's Memories",
    emoji: '🧊',
    category: 'side',
    description: "Help Frostbeak remember their past by visiting the places they've forgotten.",
    giverNpc: 'frostbeak',
    giverLocation: 'frozenPond',
    levelRequired: 3,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'remember',
        description: 'Speak with Frostbeak about their past',
        objectives: [
          { id: 'talk_frost', description: 'Talk to Frostbeak', type: 'talkToNpc', target: 'frostbeak', count: 1 },
        ],
        dialogueOnStart:
          '*Frostbeak\'s eyes go distant.* "I remember... a warm place. And a high place. Before the ice. Can you visit them for me? Tell me what you see?"',
      },
      {
        id: 'visit_memories',
        description: 'Visit the places Frostbeak remembers',
        objectives: [
          {
            id: 'warm_place',
            description: 'Visit Quackatoa (the warm place)',
            type: 'visitLocation',
            target: 'quackatoa',
            count: 1,
          },
          {
            id: 'high_place',
            description: 'Visit the Highway (the high place)',
            type: 'visitLocation',
            target: 'highway',
            count: 1,
          },
        ],
        dialogueOnComplete:
          '*Frostbeak listens to your descriptions. The ice around them cracks a little more.* "I remember now. I remember the warmth. Thank you... for being my eyes."',
      },
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'breadcrumbs', value: 30 },
      { type: 'item', value: 'hpPotion', quantity: 2 },
    ],
    repeatable: false,
  },
  {
    id: 'chad_redemption',
    name: "Chad's Redemption",
    emoji: '🦅',
    category: 'side',
    description:
      "Chad wants to go legit. Help him set up a breadcrumb stand. (Requires cutting Chad in during Trenchbill's quest.)",
    giverNpc: 'chad',
    giverLocation: 'puddle',
    levelRequired: 5,
    prerequisiteQuestIds: ['trenchbill_underworld'],
    requiresChoiceMade: { questId: 'trenchbill_underworld', choiceLabel: 'Cut Chad in for a share' },
    steps: [
      {
        id: 'legit',
        description: 'Talk to Chad about going legitimate',
        objectives: [{ id: 'talk_chad', description: 'Talk to Chad', type: 'talkToNpc', target: 'chad', count: 1 }],
        dialogueOnStart:
          '*Chad is unusually quiet.* "So... after that thing with Trenchbill... I\'ve been thinking. Maybe I should stop stealing. Maybe I should... SELL things. Like a REAL business duck."',
      },
      {
        id: 'supplies',
        description: 'Help Chad gather supplies (explore the Puddle)',
        objectives: [
          {
            id: 'puddle_supply',
            description: 'Complete 2 encounters at the Puddle',
            type: 'completeEncounter',
            target: 'puddle',
            count: 2,
          },
        ],
      },
      {
        id: 'grand_opening',
        description: "Attend Chad's grand opening",
        objectives: [
          { id: 'talk_chad_open', description: 'Talk to Chad', type: 'talkToNpc', target: 'chad', count: 1 },
        ],
        dialogueOnComplete:
          '*Chad stands behind a cardboard box with "CHAD\'S BREADCRUMBS" scrawled on it.* "WELCOME TO MY LEGITIMATE BUSINESS! ...Why are you crying? STOP CRYING! This is a PROFESSIONAL establishment!"',
      },
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'breadcrumbs', value: 40 },
      { type: 'title', value: 'chads_friend' },
    ],
    repeatable: false,
  },
]

// --- Daily Quests ---

const DAILY_QUESTS: QuestDefinition[] = [
  {
    id: 'daily_patrol',
    name: 'Daily Patrol',
    emoji: '🔍',
    category: 'daily',
    description: 'Complete 3 encounters anywhere in the Quackverse.',
    giverNpc: 'duchess',
    giverLocation: 'coliseum',
    levelRequired: 1,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'patrol',
        description: 'Explore and complete 3 encounters',
        objectives: [{ id: 'encounters', description: 'Complete 3 encounters', type: 'completeEncounter', count: 3 }],
        dialogueOnStart:
          '*The Duchess pins a patrol badge to your chest.* "The Quackverse doesn\'t patrol itself, darling. Three encounters. Chop chop."',
        dialogueOnComplete:
          '*The Duchess nods approvingly.* "Adequate patrolling. The Coliseum is marginally safer thanks to your... efforts."',
      },
    ],
    rewards: [
      { type: 'xp', value: 40 },
      { type: 'breadcrumbs', value: 20 },
    ],
    repeatable: true,
    cooldownHours: 20,
  },
  {
    id: 'daily_tourist',
    name: 'The Grand Tour',
    emoji: '🗺️',
    category: 'daily',
    description: 'Visit 3 different locations across the Quackverse.',
    giverNpc: 'attenbird',
    giverLocation: 'coliseum',
    levelRequired: 2,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'tour',
        description: 'Travel to 3 different locations',
        objectives: [
          { id: 'loc_1', description: 'Travel to a new biome', type: 'visitLocation', count: 1 },
          { id: 'loc_2', description: 'Explore a second habitat', type: 'visitLocation', count: 1 },
          { id: 'loc_3', description: 'Document a third location', type: 'visitLocation', count: 1 },
        ],
        dialogueOnStart:
          '*Sir David Attenbird adjusts his monocle.* "Today we document the habitats of the Quackverse. Three locations. I\'ll be narrating from a safe distance."',
        dialogueOnComplete:
          '*Attenbird wipes a single tear.* "Magnificent footage. Three biomes in a single day. This will be the season finale."',
      },
    ],
    rewards: [
      { type: 'xp', value: 40 },
      { type: 'breadcrumbs', value: 25 },
    ],
    repeatable: true,
    cooldownHours: 20,
  },
  {
    id: 'daily_fighter',
    name: 'Arena Training',
    emoji: '⚔️',
    category: 'daily',
    description: 'Participate in a tournament. Win or lose, the Arena respects the effort.',
    giverNpc: 'duchess',
    giverLocation: 'coliseum',
    levelRequired: 2,
    prerequisiteQuestIds: [],
    steps: [
      {
        id: 'fight',
        description: 'Enter and complete a tournament',
        objectives: [
          {
            id: 'tournament',
            description: 'Complete a tournament',
            type: 'defeatInTournament',
            count: 1,
          },
        ],
        dialogueOnStart:
          '*The Arena announcer bellows:* "FRESH MEAT FOR THE QUACKTAMENT! Step into the ring and prove your worth — win or lose, the Arena respects those who fight!"',
        dialogueOnComplete:
          '*The crowd erupts.* "Another warrior tempered in the fires of combat! The Arena remembers your name."',
      },
    ],
    rewards: [
      { type: 'xp', value: 50 },
      { type: 'breadcrumbs', value: 30 },
      { type: 'item', value: 'hpPotion', quantity: 1 },
    ],
    repeatable: true,
    cooldownHours: 20,
  },
]

// --- Quest Registry ---

export const ALL_QUESTS: QuestDefinition[] = [...MAIN_QUESTS, ...SIDE_QUESTS, ...DAILY_QUESTS]

export const getQuestById = (id: string): QuestDefinition | undefined => {
  return ALL_QUESTS.find((q) => q.id === id)
}

// --- Quest Engine ---

export const getAvailableQuests = (
  playerLevel: number,
  completedQuestIds: string[],
  activeQuestIds: string[],
  playerLocation: LocationId,
  completedQuests?: CompletedQuest[]
): QuestDefinition[] => {
  return ALL_QUESTS.filter((q) => {
    if (q.levelRequired > playerLevel) {
      return false
    }
    if (activeQuestIds.includes(q.id)) {
      return false
    }
    if (!q.repeatable && completedQuestIds.includes(q.id)) {
      return false
    }
    if (!q.prerequisiteQuestIds.every((preReq) => completedQuestIds.includes(preReq))) {
      return false
    }
    if (q.requiresChoiceMade && completedQuests) {
      const reqQuest = completedQuests.find((c) => c.questId === q.requiresChoiceMade!.questId)
      if (!reqQuest || !reqQuest.choicesMade.includes(q.requiresChoiceMade.choiceLabel)) {
        return false
      }
    }
    // Only show quests whose giver is at the player's current location
    if (q.giverLocation !== playerLocation) {
      return false
    }
    return true
  })
}

export const getAvailableQuestsFromNpc = (
  npcId: NpcId,
  playerLevel: number,
  completedQuestIds: string[],
  activeQuestIds: string[],
  completedQuests?: CompletedQuest[]
): QuestDefinition[] => {
  return ALL_QUESTS.filter((q) => {
    if (q.giverNpc !== npcId) {
      return false
    }
    if (q.levelRequired > playerLevel) {
      return false
    }
    if (activeQuestIds.includes(q.id)) {
      return false
    }
    if (!q.repeatable && completedQuestIds.includes(q.id)) {
      return false
    }
    if (!q.prerequisiteQuestIds.every((preReq) => completedQuestIds.includes(preReq))) {
      return false
    }
    if (q.requiresChoiceMade && completedQuests) {
      const reqQuest = completedQuests.find((c) => c.questId === q.requiresChoiceMade!.questId)
      if (!reqQuest || !reqQuest.choicesMade.includes(q.requiresChoiceMade.choiceLabel)) {
        return false
      }
    }
    return true
  })
}

export const getCurrentStep = (quest: QuestProgress, questDef: QuestDefinition): QuestStep | undefined => {
  return questDef.steps.find((s) => s.id === quest.currentStepId)
}

export const getStepIndex = (questDef: QuestDefinition, stepId: string): number => {
  return questDef.steps.findIndex((s) => s.id === stepId)
}

export const checkObjectiveProgress = (
  quest: QuestProgress,
  questDef: QuestDefinition,
  eventType: QuestObjectiveType,
  eventTarget?: string
): { updated: boolean; objectiveCompleted?: string } => {
  const step = getCurrentStep(quest, questDef)
  if (!step) {
    return { updated: false }
  }

  for (const obj of step.objectives) {
    if (obj.type !== eventType) {
      continue
    }
    // Target matching: undefined target means "any"
    if (obj.target && eventTarget && obj.target !== eventTarget) {
      continue
    }
    const currentProgress = quest.objectiveProgress[obj.id] ?? 0
    if (currentProgress >= obj.count) {
      continue
    }
    quest.objectiveProgress[obj.id] = currentProgress + 1
    if (quest.objectiveProgress[obj.id]! >= obj.count) {
      return { updated: true, objectiveCompleted: obj.description }
    }
    return { updated: true }
  }
  return { updated: false }
}

export const isStepComplete = (quest: QuestProgress, questDef: QuestDefinition): boolean => {
  const step = getCurrentStep(quest, questDef)
  if (!step) {
    return false
  }
  // Steps with choices and no objectives are complete (choice resolves them)
  if (step.objectives.length === 0 && step.choices && step.choices.length > 0) {
    return true
  }
  return step.objectives.every((obj) => (quest.objectiveProgress[obj.id] ?? 0) >= obj.count)
}

export const advanceToNextStep = (
  quest: QuestProgress,
  questDef: QuestDefinition,
  choiceStepId?: string
): { completed: boolean; nextStep?: QuestStep } => {
  const currentIdx = getStepIndex(questDef, quest.currentStepId)

  // If step has choices and a choice was made, go to the choice's nextStepId
  if (choiceStepId) {
    if (choiceStepId === 'complete') {
      return { completed: true }
    }
    const nextStep = questDef.steps.find((s) => s.id === choiceStepId)
    if (nextStep) {
      quest.currentStepId = nextStep.id
      quest.objectiveProgress = {}
      return { completed: false, nextStep }
    }
  }

  // Otherwise advance linearly
  const nextIdx = currentIdx + 1
  if (nextIdx >= questDef.steps.length) {
    return { completed: true }
  }

  // Skip steps that have id matching 'complete' (terminal)
  const nextStep = questDef.steps[nextIdx]
  if (!nextStep || nextStep.id === 'complete') {
    return { completed: true }
  }

  quest.currentStepId = nextStep.id
  quest.objectiveProgress = {}
  return { completed: false, nextStep }
}

// --- Quest Journal Formatting ---

export const formatQuestJournal = (
  activeQuests: QuestProgress[],
  completedQuests: CompletedQuest[],
  playerLevel: number,
  playerLocation: LocationId,
  generatedQuests?: QuestDefinition[]
): string => {
  const lines: string[] = ['**Your Quest Journal**', '']

  const lookup = (id: string): QuestDefinition | undefined =>
    getQuestById(id) ?? generatedQuests?.find((g) => g.id === id)

  // Active quests
  if (activeQuests.length > 0) {
    lines.push('**Active Quests:**')
    for (const aq of activeQuests) {
      const def = lookup(aq.questId)
      if (!def) {
        continue
      }
      const stepIdx = getStepIndex(def, aq.currentStepId) + 1
      const isBounty = aq.questId.startsWith('bounty_')
      const tag = isBounty ? '[BOUNTY]' : `[${def.category.toUpperCase()}]`
      lines.push(`  ${def.emoji} ${tag} **${def.name}** (Step ${stepIdx}/${def.steps.length})`)
      const step = getCurrentStep(aq, def)
      if (step) {
        for (const obj of step.objectives) {
          const progress = aq.objectiveProgress[obj.id] ?? 0
          const done = progress >= obj.count ? '✅' : '⬜'
          lines.push(`    ${done} ${obj.description} (${progress}/${obj.count})`)
        }
      }
    }
    lines.push('')
  }

  // Available quests (at current location)
  const completedIds = completedQuests.map((q) => q.questId)
  const activeIds = activeQuests.map((q) => q.questId)
  const available = getAvailableQuests(playerLevel, completedIds, activeIds, playerLocation, completedQuests)
  if (available.length > 0) {
    lines.push('**Available Here:**')
    for (const q of available) {
      lines.push(`  ${q.emoji} ${q.name} (Lvl ${q.levelRequired}) — *${q.description.slice(0, 60)}...*`)
    }
    lines.push('')
  }

  lines.push(`**Completed:** ${completedQuests.length} quests`)
  return lines.join('\n')
}

export const getQuestStepProgress = (quest: QuestProgress, questDef: QuestDefinition): string => {
  const stepIdx = getStepIndex(questDef, quest.currentStepId) + 1
  return `${stepIdx}/${questDef.steps.length}`
}
