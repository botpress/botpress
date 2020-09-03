import * as sdk from 'botpress/sdk'

export interface TrainInput {
  language: string
  topics: {
    [topic: string]: sdk.NLU.IntentDefinition[]
  }
  entities: sdk.NLU.EntityDefinition[]
  password: string
  seed?: number
}
