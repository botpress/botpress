import * as sdk from 'botpress/sdk'

import { NLUStructure, PipelineProcessManager } from './typings'

export type PipelineStep = (ds: NLUStructure) => Promise<NLUStructure>

export class PipelineManager implements PipelineProcessManager {
  private _nluds!: NLUStructure
  private _pipeline!: PipelineStep[]

  public withPipeline(pipeline: PipelineStep[]): PipelineProcessManager {
    this._pipeline = pipeline
    return this
  }

  public initFromText(text: string, includedContexts: string[]): PipelineProcessManager {
    this._nluds = initNLUDS(text, includedContexts)
    return this
  }

  public async run(): Promise<NLUStructure> {
    if (!this._nluds) {
      throw new Error('You must add a NLUDS to the pipeline manager before runinng it')
    }

    if (!this._pipeline) {
      throw new Error('You must add a pipeline to the pipeline manager before runinng it')
    }

    let ds = this._nluds
    for (const step of this._pipeline) {
      ds = await step(ds)
    }
    return ds
  }
}

export const initNLUDS = (text: string, includedContexts: string[]): NLUStructure => {
  return {
    rawText: text,
    lowerText: '',
    includedContexts: includedContexts,
    detectedLanguage: '',
    language: '',
    entities: [],
    intents: [],
    intent: {} as sdk.NLU.Intent,
    sanitizedText: '',
    tokens: [],
    slots: {}
  }
}
