import { NLUDS, PipelineProcessManager } from './typings'

export class PipelineManager implements PipelineProcessManager {
  private _nluds: NLUDS
  private _scope: any
  private _pipeline: Function[]

  private _reducer = async (ds: Promise<NLUDS>, fn: Function): Promise<NLUDS> => fn.call(this._scope, await ds)

  public of(ds: NLUDS): PipelineProcessManager {
    this._nluds = ds
    return this
  }

  public withPipeline(pipeline: Function[]): PipelineProcessManager {
    this._pipeline = pipeline
    return this
  }

  public withScope(scope: any): PipelineProcessManager {
    this._scope = scope
    return this
  }

  public async run(): Promise<NLUDS> {
    if (!this._nluds) {
      throw new Error('You must initialize the pipeline manager before runinng it')
    }

    if (!this._scope) {
      throw new Error('You must add a scope to the pipeline manager before running it')
    }

    return await this._pipeline.reduce(this._reducer, Promise.resolve(this._nluds))
  }
}

export const initNLUDS = (text: string, includedContexts: string[]): NLUDS => {
  return {
    rawText: text,
    includedContexts: includedContexts,
    lang: '',
    entities: [],
    intents: [],
    intent: undefined,
    sanitizedText: '',
    tokens: [],
    slots: {},
    execute: undefined
  }
}
