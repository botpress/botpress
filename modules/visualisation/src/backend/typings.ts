import * as sdk from 'botpress/sdk'

import { BotpressPredictor } from '../models/botpress_predictor'
// import { BotpressEmbedder, PythonEmbedder } from '../models/embedder'

export interface BotState {
  // embedder: BotpressEmbedder | PythonEmbedder
  axiosConfig: sdk.AxiosBotConfig
  predictor: BotpressPredictor
  botId: string
  ghost: sdk.ScopedGhostService
  trainDatas: Data[]
  testDatas: Data[]
  language: string
  engine: sdk.NLU.Engine
}

export interface PredRes {
  utt: string
  acc: boolean
  conf: number
  pred: string
  gt: string
}

export interface VisuState {
  [botId: string]: BotState
}

export interface Data {
  utt: string
  utt_emb: number[]
  label?: number
  intent: string
}

export interface RawData {
  name: string
  contexts: string[]
  utterances: { [lang: string]: string[] }
  slots: any[]
}

export interface PlotData {
  x: number[]
  y: number[]
  z?: number[]
  mode: string
  type: string
  name: string
  text: string[]
  marker: { size: number }
}

export interface Test {
  id: string
  utterance: string
  context: string
  conditions: [string, string, string][]
}
export const BadMessages = [
  'N/A',
  'Yes. I speak English and French.',
  "Sorry, I'm not an entertainment bot. I've been created to provide answers about COVID-19 to the best of my ability.",
  'De rien',
  'Désolé. Je ne suis pas un robot de conversation. Mon rôle est de répondre le plus efficacement possible à vos questions sur la COVID-19.',
  'Au revoir',
  'Merci',
  'Thanks',
  'Goodbye'
]
