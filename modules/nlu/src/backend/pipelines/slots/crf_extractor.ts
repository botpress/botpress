import * as sdk from 'botpress/sdk'
import fs, { readFileSync } from 'fs'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import tmp from 'tmp'

import { BIO, Sequence, SlotExtractor, Token } from '../../typings'

import { generatePredictionSequence } from './pre-processor'

const debug = DEBUG('nlu').sub('slots')
const debugTrain = debug.sub('train')
const debugExtract = debug.sub('extract')
const debugVectorize = debug.sub('vectorize')

// TODO grid search / optimization for those hyperparams
const K_CLUSTERS = 15
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
}
const CRF_TRAINER_PARAMS = {
  c1: '0.0001',
  c2: '0.01',
  max_iterations: '500',
  'feature.possible_transitions': '1',
  'feature.possible_states': '1'
}

export default class CRFExtractor implements SlotExtractor {
  private _isTrained: boolean = false
  private _ftModelFn = ''
  private _crfModelFn = ''
  private _ft!: sdk.MLToolkit.FastText.Model
  private _tagger!: sdk.MLToolkit.CRF.Tagger
  private _kmeansModel

  constructor(private toolkit: typeof sdk.MLToolkit) {}

  async load(traingingSet: Sequence[], languageModelBuf: Buffer, crf: Buffer) {
    // load language model
    const ftModelFn = tmp.tmpNameSync({ postfix: '.bin' })
    fs.writeFileSync(ftModelFn, languageModelBuf)

    const ft = new this.toolkit.FastText.Model()
    await ft.loadFromFile(ftModelFn)
    this._ft = ft
    this._ftModelFn = ftModelFn

    // load kmeans (retrain because there is no simple way to store it)
    await this._trainKmeans(traingingSet)

    // load crf model
    this._crfModelFn = tmp.tmpNameSync()
    fs.writeFileSync(this._crfModelFn, crf)
    this._tagger = this.toolkit.CRF.createTagger()
    await this._tagger.open(this._crfModelFn)
    this._isTrained = true
  }

  async train(trainingSet: Sequence[]): Promise<{ language: Buffer; crf: Buffer }> {
    this._isTrained = false
    if (trainingSet.length >= 2) {
      debugTrain('start training')
      debugTrain('training language model')
      await this._trainLanguageModel(trainingSet)
      debugTrain('training kmeans')
      await this._trainKmeans(trainingSet)
      debugTrain('training CRF')
      await this._trainCrf(trainingSet)
      debugTrain('reading tagger')
      this._tagger = this.toolkit.CRF.createTagger()
      await this._tagger.open(this._crfModelFn)
      this._isTrained = true
      debugTrain('done training')
      return {
        language: readFileSync(this._ftModelFn),
        crf: readFileSync(this._crfModelFn)
      }
    } else {
      debugTrain('training set too small, skipping training')
      return {
        language: undefined,
        crf: undefined
      }
    }
  }

  /**
   * Returns an object with extracted slots name as keys.
   * Each slots under each keys can either be a single Slot object or Array<Slot>
   * return value example:
   * slots: {
   *   artist: {
   *     name: "artist",
   *     value: "Kanye West",
   *     entity: [Object] // corresponding sdk.NLU.Entity
   *   },
   *   songs : [ multiple slots objects here]
   * }
   */
  async extract(
    text: string,
    intentDef: sdk.NLU.IntentDefinition,
    entities: sdk.NLU.Entity[]
  ): Promise<sdk.NLU.SlotsCollection> {
    debugExtract(text, { entities })
    const seq = generatePredictionSequence(text, intentDef.name, entities)
    const tags = await this._tag(seq)
    // notice usage of zip here, we want to loop on tokens and tags at the same index
    return (_.zip(seq.tokens, tags) as [Token, string][])
      .filter(([token, tag]) => {
        if (!token || !tag || tag === BIO.OUT) {
          return false
        }

        const slotName = tag.slice(2)
        return intentDef.slots.find(slotDef => slotDef.name === slotName) !== undefined
      })
      .reduce((slotCollection: any, [token, tag]) => {
        const slotName = tag.slice(2)
        const slot = this._makeSlot(slotName, token, intentDef.slots, entities)
        if (tag[0] === BIO.INSIDE && slotCollection[slotName]) {
          // prevent cases where entity has multiple tokens e.g. "4 months months"
          if (!slot.entity || token.end > slot.entity.meta.end) {
            // simply append the source if the tag is inside a slot
            slotCollection[slotName].source += ` ${token.value}`
          }
        } else if (tag[0] === BIO.BEGINNING && slotCollection[slotName]) {
          // if the tag is beginning and the slot already exists, we create need a array slot
          if (Array.isArray(slotCollection[slotName])) {
            slotCollection[slotName].push(slot)
          } else {
            // if no slots exist we assign a slot to the slot key
            slotCollection[slotName] = [slotCollection[slotName], slot]
          }
        } else {
          slotCollection[slotName] = slot
        }
        return slotCollection
      }, {})
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

  private _makeSlot(
    slotName: string,
    token: Token,
    slotDefinitions: sdk.NLU.SlotDefinition[],
    entities: sdk.NLU.Entity[]
  ): sdk.NLU.Slot {
    const slotDef = slotDefinitions.find(slotDef => slotDef.name === slotName)
    const entity =
      slotDef &&
      entities.find(
        e => slotDef.entities.indexOf(e.name) !== -1 && e.meta.start <= token.start && e.meta.end >= token.end
      )

    const value = _.get(entity, 'data.value', token.value)
    const source = _.get(entity, 'meta.source', token.value)

    const slot = {
      name: slotName,
      value,
      source
    } as sdk.NLU.Slot

    if (entity) {
      slot.entity = entity
    }

    return slot
  }

  private async _trainKmeans(sequences: Sequence[]): Promise<any> {
    const tokens = _.flatMap(sequences, s => s.tokens)
    const data = await Promise.mapSeries(tokens, t => this._ft.queryWordVectors(t.value))
    const k = data.length > K_CLUSTERS ? K_CLUSTERS : 2
    try {
      this._kmeansModel = kmeans(data, k, KMEANS_OPTIONS)
    } catch (error) {
      throw Error('Error training K-means model')
    }
  }

  private async _trainCrf(sequences: Sequence[]) {
    this._crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const trainer = this.toolkit.CRF.createTrainer()
    trainer.set_params(CRF_TRAINER_PARAMS)
    trainer.set_callback(str => {
      /* swallow training results */
    })

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

    const ft = new this.toolkit.FastText.Model()

    const trainContent = samples.reduce((corpus, seq) => {
      const cannonicSentence = seq.tokens
        .map(s => {
          if (s.tag === BIO.OUT) return s.value
          else return s.slot
        })
        .join(' ')
      return `${corpus}${cannonicSentence}\n`
    }, '')

    fs.writeFileSync(ftTrainFn, trainContent, 'utf8')

    const skipgramParams = {
      input: ftTrainFn,
      minCount: 2,
      dim: 15,
      lr: 0.05,
      epoch: 50,
      wordNgrams: 3
    }

    debugTrain('training skipgram', skipgramParams)
    await ft.trainToFile('skipgram', this._ftModelFn, skipgramParams)

    this._ft = ft
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

    const entitiesFeatures = (token.matchedEntities.length ? token.matchedEntities : ['none']).map(
      ent => `${featPrefix}entity=${ent === 'any' ? 'none' : ent}`
    )

    return [...vector, ...entitiesFeatures]
  }

  // TODO maybe use a slice instead of the whole token seq ?
  private async _vectorize(tokens: Token[], intentName: string, idx: number): Promise<string[]> {
    const prev = idx === 0 ? ['w[0]bos'] : await this._vectorizeToken(tokens[idx - 1], intentName, 'w[-1]', true)
    const current = await this._vectorizeToken(tokens[idx], intentName, 'w[0]', false)
    const next =
      idx === tokens.length - 1 ? ['w[0]eos'] : await this._vectorizeToken(tokens[idx + 1], intentName, 'w[1]', true)

    debugVectorize(`"${tokens[idx].value}" (${idx})`, { prev, current, next })

    return [...prev, ...current, ...next]
  }

  private async _getWordCluster(word: string): Promise<number> {
    const vector = await this._ft.queryWordVectors(word)
    return this._kmeansModel.nearest([vector])[0]
  }
}
