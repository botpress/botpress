import * as sdk from 'botpress/sdk'

export interface BotState {
  axiosConfig: sdk.AxiosBotConfig
  botId: string
  ghost: sdk.ScopedGhostService
  trainDatas: Data[]
  testDatas: Data[]
  language: string
}

export interface VisuState {
  [botId: string]: BotState
}

export interface Data {
  ctx: string
  utt: string
  utt_emb: number[]
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

export interface JobInfo {
  status: string
  error: string
}

export interface PlotlyDatas {
  x: string[]
  y: string[]
  z: number[][]
  type: string
}
