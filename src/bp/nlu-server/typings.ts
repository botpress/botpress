export interface TrainInput {
  language: string
  topics: Topic[]
  enums: Enum[]
  patterns: Pattern[]
  complexes: Complex[]
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
  type: string
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

export type Complex = {
  name: string
  enums: string[]
  patterns: string[]
  examples: string[]
}
