import { MLToolkit } from 'botpress/sdk'

export interface ModelSet {
  bpeModel: AvailableModel | LoadedBPEModel
  fastTextModel: AvailableModel | LoadedFastTextModel
}

export interface AvailableModel {
  name: string
  path: string
  loaded: boolean
}

export interface LoadedFastTextModel extends AvailableModel {
  model: MLToolkit.FastText.Model
  sizeInMb: number
}

export interface LoadedBPEModel extends AvailableModel {
  tokenizer: MLToolkit.SentencePiece.Processor
  sizeInMb: number
}

export interface ModelFileInfo {
  domain: string
  langCode: string
  file: string
  dim?: number
}
