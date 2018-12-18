import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import tmp from 'tmp'

import FastText, { FastTextTrainArgs } from '../../tools/fastText'
import { Sequence, SlotExtractor, Token } from '../../typings'

import { generatePredictionSequence } from './pre-processor'

// TODO grid search / optimization for those hyperparams
const K_CLUSTERS = 15
const CRF_TRAINER_PARAMS = {
  c1: '0.0001',
  c2: '0.01',
  max_iterations: '500',
  'feature.possible_transitions': '1',
  'feature.possible_states': '1'
}
const FT_PARAMS: FastTextTrainArgs = {
  method: 'skipgram',
  minCount: 2,
  bucket: 25000,
  dim: 15,
  learningRate: 0.5,
  wordGram: 3,
  maxn: 6,
  minn: 2,
  epoch: 50
}

export default class CRFExtractor implements SlotExtractor {
  private _isTrained: boolean = false
  private _ftModelFn = ''
  private _crfModelFn = ''
  private _ft!: FastText
  private _tagger!: sdk.MLToolkit.CRF.Tagger
  private _kmeansModel

  constructor(private toolkit: typeof sdk.MLToolkit) { }

  async train(trainingSet: Sequence[]) {
    this._isTrained = false
    await this._trainLanguageModel(trainingSet)
    await this._trainKmeans(trainingSet)
    await this._trainCrf(trainingSet)

    this._tagger = this.toolkit.CRF.createTagger()
    await this._tagger.open(this._crfModelFn)
    this._isTrained = true
  }

  async extract(text: string, intentDef: sdk.NLU.IntentDefinition, entitites: sdk.NLU.Entity[]) {
    const seq = generatePredictionSequence(text, intentDef.name, entitites)
    const tags = await this._tag(seq)

    return _.zip(seq.tokens, tags)
      .filter(([token, tag]) => {
        if (!token || !tag || tag === 'o') return false

        const slotName = tag.slice(2)
        return intentDef.slots.find(slotDef => slotDef.name === slotName) !== undefined
      })
      .reduce((slots: any, [token, tag]) => {
        const slotName = tag.slice(2)
        const slot = this._makeSlot(slotName, token, entitites)
        if (tag[0] === 'I' && slots[slotName]) {
          slots[slotName].source += ` ${token.value}`
        } else if (tag[0] === 'B' && slots[slotName]) {
          if (Array.isArray(slots[slotName])) {
            slotName[slotName].push(slot)
          }
          else slots[slotName] = [slots[slotName], slot]
        } else {
          slots[slotName] = slot
        }
        return slots
      }, {})
  }

  // TODO use slot definitions here
  _makeSlot(slotName: string, token: Token, entitites: sdk.NLU.Entity[]): any {
    // we might only want to attach the entity defined in the slot definition, not more
    // to do so, instead of find, use a .filter that matches the slot definition for this particural slotName
    const entity = entitites.find(e => e.meta.start <= token.start && e.meta.end >= token.end)
    const value = entity ? _.get(entity, 'data.value', token.value) : token.value
    return {
      name: slotName,
      source: token.value,
      value,
      entity
    }
  }

  // this is made "protected" to facilitate model validation
  async _tag(seq: Sequence): Promise<string[]> {
    if (!this._isTrained) {
      throw new Error('Model not trained, please call train() before')
    }
    const inputVectors: string[][] = []
    for (let i = 0; i < seq.tokens.length; i++) {
      const featureVec = await this._vectorize(seq.tokens, seq.intent, i)

      inputVectors.push(featureVec)
    }

    return this._tagger.tag(inputVectors).result
  }

  private async _trainKmeans(sequences: Sequence[]): Promise<any> {
    const tokens = _.flatMap(sequences, s => s.tokens)
    const data = await Promise.mapSeries(tokens, async t => await this._ft.wordVectors(t.value))
    try {
      this._kmeansModel = kmeans(data, K_CLUSTERS)
    } catch (error) {
      console.error('error tra ining Kmeans', error)
      throw error
    }
  }

  private async _trainCrf(sequences: Sequence[]) {
    this._crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const trainer = this.toolkit.CRF.createTrainer()
    trainer.set_params(CRF_TRAINER_PARAMS)
    trainer.set_callback(str => {/* swallow training results */ })

    for (const seq of sequences) {
      const inputVectors: string[][] = []
      const labels: string[] = []
      for (let i = 0; i < seq.tokens.length; i++) {
        const featureVec = await this._vectorize(seq.tokens, seq.intent, i)

        inputVectors.push(featureVec)

        const labelSlot = seq.tokens[i].slot ? `-${seq.tokens[i].slot}` : ''
        labels.push(`${seq.tokens[i].tag}${labelSlot}`)
      }
      trainer.append(inputVectors, labels)
    }

    trainer.train(this._crfModelFn)
  }

  private async _trainLanguageModel(samples: Sequence[]) {
    this._ftModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const ftTrainFn = tmp.fileSync({ postfix: '.txt' }).name
    this._ft = new FastText(this._ftModelFn)

    const trainContent = samples.reduce((corpus, seq) => {
      const cannonicSentence = seq.tokens
        .map(s => {
          if (s.tag === 'o') return s.value
          else return s.slot
        })
        .join(' ')
      return `${corpus}${cannonicSentence}\n`
    }, '')

    fs.writeFileSync(ftTrainFn, trainContent, 'utf8')
    this._ft.train(ftTrainFn, FT_PARAMS)
  }

  private async _vectorizeToken(
    token: Token,
    intentName: string,
    featPrefix: string,
    includeCluster: boolean
  ): Promise<string[]> {
    const vector: string[] = [`${featPrefix}intent=${intentName}`]

    if (token.value === token.value.toLowerCase()) vector.push(`${featPrefix}low`)
    if (token.value === token.value.toUpperCase()) vector.push(`${featPrefix}up`)
    if (
      token.value.length > 1 &&
      token.value[0] === token.value[0].toUpperCase() &&
      token.value[1] === token.value[1].toLowerCase()
    )
      vector.push(`${featPrefix}title`)
    if (includeCluster) {
      const cluster = await this._getWordCluster(token.value)
      vector.push(`${featPrefix}cluster=${cluster.toString()}`)
    }

    const entititesFeatures = (token.matchedEntities.length ? token.matchedEntities : ['none']).map(
      ent => `${featPrefix}entity=${ent}`
    )

    return [...vector, ...entititesFeatures]
  }

  // TODO maybe use a slice instead of the whole token seq ?
  private async _vectorize(tokens: Token[], intentName: string, idx: number): Promise<string[]> {
    const prev = idx === 0 ? ['w[0]bos'] : await this._vectorizeToken(tokens[idx - 1], intentName, 'w[-1]', true)
    const current = await this._vectorizeToken(tokens[idx], intentName, 'w[0]', false)
    const next =
      idx === tokens.length - 1 ? ['w[0]eos'] : await this._vectorizeToken(tokens[idx + 1], intentName, 'w[1]', true)

    return [...prev, ...current, ...next]
  }

  private async _getWordCluster(word: string): Promise<number> {
    const vector = await this._ft.wordVectors(word)
    return this._kmeansModel.nearest([vector])[0]
  }
}
