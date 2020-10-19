export interface TrainInput {
  language: string
  topics: Topic[]
  enums: Enum[]
  patterns: Pattern[]
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
  types: string[]
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
  regex: string
  case_sensitive: boolean
  examples: string[]
}
