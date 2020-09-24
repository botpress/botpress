import * as sdk from 'botpress/sdk'

export interface TrainInput {
  language: string
  topics: {
    [topic: string]: sdk.NLU.IntentDefinition[] // TODO: change this for new API spec
  }
  entities: sdk.NLU.EntityDefinition[]
  password: string
  seed?: number
}
