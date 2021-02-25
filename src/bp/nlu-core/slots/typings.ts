import { Tag } from 'nlu-core/typings'

export interface TagResult {
  tag: Tag | string
  name: string
  probability: number
}

export interface IntentSlotFeatures {
  name: string
  vocab: string[]
  slot_entities: string[]
}
