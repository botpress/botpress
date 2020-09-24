export interface TrainInput {
  language: string
  topics: {
    [topic: string]: Topic
  }
  enums: Enum[]
  patterns: Pattern[] // TODO: add complexs
  password: string
  seed?: number
}

export interface Topic {
  name: string
  intents: Intent[]
}

export interface Intent {
  name: string
  variables: Variable[]
  examples: string[]
}

export interface Variable {
  name: string
  variableType: string
}

export interface Enum {
  name: string
  values: EnumOccurence[]
  fuzzy: number
}

export interface EnumOccurence {
  name: string
  synonyms: string[]
}

export interface Pattern {
  name: string
  positive_regexes: string
  case_sensitive: boolean
}
