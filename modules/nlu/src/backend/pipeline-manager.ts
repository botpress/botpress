import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

import { NLUStructure } from './typings'

export type PipelineStep = (ds: NLUStructure) => Promise<NLUStructure>

// DEPRECATED
export class PipelineManager {
  private _nluds!: NLUStructure
  private _pipeline!: PipelineStep[]
  private _retryCount: number = 0

  private retryPolicy = {
    interval: 100,
    max_interval: 500,
    timeout: 5000,
    max_tries: 3
  }
  constructor(private logger: sdk.Logger) {}

  public withPipeline(pipeline: PipelineStep[]): PipelineManager {
    this._pipeline = pipeline
    return this
  }

  public initFromText(text: string, lastMessages: string[], includedContexts: string[]): PipelineManager {
    this._nluds = initNLUStruct(text, lastMessages, includedContexts)
    return this
  }

  public run = async (): Promise<NLUStructure> => {
    this._retryCount = 0
    return await retry(this._run, this.retryPolicy)
  }

  private _run = async (): Promise<NLUStructure> => {
    if (!this._nluds) {
      throw new Error('You must add a NLUDS to the pipeline manager before runinng it')
    }

    if (!this._pipeline) {
      throw new Error('You must add a pipeline to the pipeline manager before runinng it')
    }

    let ds = this._nluds

    for (const step of this._pipeline) {
      try {
        ds = await step(ds)
      } catch (error) {
        if (++this._retryCount < this.retryPolicy.max_tries) {
          throw error
        } else {
          this.logger.attachError(error).error(`Could not extract whole NLU data, ${error}`)
          ds.errored = true

          return ds // exit loop and return partially populated ds
        }
      }
    }

    ds.errored = false
    return ds
  }
}

export interface PipelineOutput {
  result: NLUStructure
  cache: any
}

export interface PipelineInput {
  text: string
  lastMessages: string[]
  includedContexts: string[]
}

export interface PipelineOptions {
  caching: boolean
  cache?: any
}

export interface PipelineStep2 {
  inputProps: (keyof NLUStructure)[]
  outputProps: (keyof NLUStructure)[]
  cacheHashAlgorithm: CacheHashingAlgorithm
  execute: (ds: NLUStructure) => Promise<NLUStructure>
}

export type CacheHashingAlgorithm = (ds: NLUStructure, inputProps: (keyof NLUStructure)[]) => string | undefined

export const DefaultHashAlgorithm: CacheHashingAlgorithm = (ds, inputProps) => {
  const partial = _.pick(ds, inputProps)
  const content = JSON.stringify(partial)
  return crypto
    .createHash('md5')
    .update(content)
    .digest('hex')
}

export const NoneHashAlgorithm: CacheHashingAlgorithm = (ds, inputProps) => undefined

export async function runPipeline(
  pipelineSteps: PipelineStep2[],
  input: PipelineInput,
  options: PipelineOptions
): Promise<PipelineOutput> {
  let ds = initNLUStruct(input.text, input.lastMessages, input.includedContexts)
  const cache = options.caching ? { ...(options.cache || {}) } : {}

  for (const step of pipelineSteps) {
    const hash = options.caching ? step.cacheHashAlgorithm(ds, step.inputProps) : undefined
    const cacheKey = `step__${step.execute.name}__${hash}`

    if (typeof hash === 'string' && cache[cacheKey]) {
      // use cached result
      const cachedProps = cache[cacheKey]
      ds = { ...ds, ...cachedProps }
    } else {
      // run, and optionally cache resultss
      ds = await step.execute(ds)
      if (options.caching) {
        cache[cacheKey] = _.cloneDeep(_.pick(ds, step.outputProps))
      }
    }
  }

  return {
    result: ds,
    cache: cache
  }
}

// exported for testing purposes
export const initNLUStruct = (rawText: string, lastMessages: string[], includedContexts: string[]): NLUStructure => {
  return {
    rawText,
    sanitizedText: '',
    sanitizedLowerText: '',
    lastMessages,
    includedContexts: includedContexts,
    detectedLanguage: '',
    language: '',
    entities: [],
    ambiguous: false,
    intent: {} as sdk.NLU.Intent,
    intents: [],
    tokens: [],
    slots: {}
  }
}
