import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import './sdk.u.test'

export const fruitEntity: NLU.EntityDefinition = {
  name: 'fruits',
  id: 'list.fruits',
  type: 'list',
  fuzzy: 1,
  examples: ['banana', 'blueberry']
}

export const cityEntity: NLU.EntityDefinition = {
  name: 'city',
  id: 'list.city',
  type: 'list',
  fuzzy: 1,
  examples: ['new-york', 'nyk', 'mtl', 'montreal']
}

const hello_utts = {
  en: ['hey', 'hello man', 'hi', 'whatsup'],
  fr: ['héhé', 'allo', 'salut', 'ça va?']
}
export const hello = (langs: string[]): NLU.IntentDefinition => ({
  name: 'hello',
  contexts: ['global'],
  slots: [],
  utterances: _.pick(hello_utts, langs) as _.Dictionary<string[]>
})

const book_flight_utts = {
  en: ['I want to book a flight', 'book flight', 'go from mtl to nyk'],
  fr: ['Je veux réserver un vol', 'réserver vol', 'aller de montreal à new-york']
}
export const book_flight = (langs: string[]): NLU.IntentDefinition => ({
  name: 'book_flight',
  contexts: ['global'],
  slots: [
    { name: 'city-from', id: 'city-from', entities: ['city'], color: 1 },
    { name: 'city-to', id: 'city-to', entities: ['city'], color: 1 }
  ],
  utterances: _.pick(book_flight_utts, langs) as _.Dictionary<string[]>
})

const i_love_hockey_utts = {
  en: ['I like hockey', 'I love hockey', 'I wanna play hockey forever'],
  fr: ["J'aime le hockey", "J'adore le hockey", 'Je veux jouer au hockey toujours']
}
export const i_love_hockey = (langs: string[]): NLU.IntentDefinition => ({
  name: 'i_love_hockey',
  contexts: ['global'],
  slots: [],
  utterances: _.pick(i_love_hockey_utts, langs) as _.Dictionary<string[]>
})
