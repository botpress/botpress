import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import tmp from 'tmp'

import { BIO, Intent, SlotExtractionResult, Tag } from '../typings'
import Utterance, { UtteranceToken } from '../utterance/utterance'

import * as featurizer from './slot-featurizer'

export interface TagResult {
  tag: Tag | string
  name: string
  probability: number
}

const debugTrain = DEBUG('nlu').sub('training')
const debugExtract = DEBUG('nlu').sub('extract')

const CRF_TRAINER_PARAMS = {
  c1: '0.0001',
  c2: '0.01',
  max_iterations: '500',
  'feature.possible_transitions': '1',
  'feature.possible_states': '1'
}

const MIN_SLOT_CONFIDENCE = 0.15

export function labelizeUtterance(utterance: Utterance): string[] {
  return utterance.tokens
    .filter(x => !x.isSpace)
    .map(token => {
      if (_.isEmpty(token.slots)) {
        return BIO.OUT
      }

      const slot = token.slots[0]
      const tag = slot.startTokenIdx === token.index ? BIO.BEGINNING : BIO.INSIDE
      const any = _.isEmpty(token.entities) ? '/any' : ''

      return `${tag}-${slot.name}${any}`
    })
}

export function predictionLabelToTagResult(prediction: { [label: string]: number }): TagResult {
  const [label, probability] = _.chain(prediction)
    .mapValues((value, key) => value + (prediction[key + '/any'] || 0))
    .toPairs()
    .maxBy('1')
    .value()

  return {
    tag: label[0],
    name: label.slice(2).replace('/any', ''),
    probability
  } as TagResult
}

export function removeInvalidTagsForIntent(intent: Intent<Utterance>, tag: TagResult): TagResult {
  if (tag.tag === BIO.OUT) {
    return tag
  }

  const foundInSlotDef = !!intent.slot_definitions.find(s => s.name === tag.name)

  if (tag.probability < MIN_SLOT_CONFIDENCE || !foundInSlotDef) {
    tag = {
      tag: BIO.OUT,
      name: '',
      probability: 1 - tag.probability // anything would do here
    }
  }

  return tag
}

export function makeExtractedSlots(
  intent: Intent<Utterance>,
  utterance: Utterance,
  slotTagResults: TagResult[]
): SlotExtractionResult[] {
  return _.zip(
    utterance.tokens.filter(t => !t.isSpace),
    slotTagResults
  )
    .filter(([token, tagRes]) => tagRes.tag !== BIO.OUT)
    .reduce((combined, [token, tagRes]) => {
      const last = _.last(combined)
      const shouldConcatWithPrev = tagRes.tag === BIO.INSIDE && _.get(last, 'slot.name') === tagRes.name

      if (shouldConcatWithPrev) {
        const newEnd = token.offset + token.value.length
        const newSource = utterance.toString({ entities: 'keep-default' }).slice(last.start, newEnd) // we use slice in case tokens are space split
        last.slot.source = newSource
        last.slot.value = newSource
        last.end = newEnd

        return [...combined.slice(0, -1), last]
      } else {
        return [
          ...combined,
          {
            slot: {
              name: tagRes.name,
              confidence: tagRes.probability,
              source: token.toString(),
              value: token.toString()
            },
            start: token.offset,
            end: token.offset + token.value.length
          }
        ]
      }
    }, [])
    .map((extracted: SlotExtractionResult) => {
      const associatedEntityInRange = utterance.entities.find(
        e =>
          ((e.startPos <= extracted.start && e.endPos >= extracted.end) || // entity is fully within the tagged slot
            (e.startPos >= extracted.start && e.endPos <= extracted.end)) && // slot is fully contained by an entity
          _.includes(intent.slot_entities, e.type) // entity is part of the possible entities
      )
      if (associatedEntityInRange) {
        extracted.slot.value = associatedEntityInRange.value
      }
      return extracted
    })
}

export default class SlotTagger {
  private _crfModelFn = ''
  private _crfTagger!: sdk.MLToolkit.CRF.Tagger

  constructor(private mlToolkit: typeof sdk.MLToolkit) {}

  load(crf: Buffer) {
    this._crfModelFn = tmp.tmpNameSync()
    fs.writeFileSync(this._crfModelFn, crf)
    this._readTagger()
  }

  private _readTagger() {
    this._crfTagger = this.mlToolkit.CRF.createTagger()
    this._crfTagger.open(this._crfModelFn)
  }

  async train(intents: Intent<Utterance>[]): Promise<void> {
    const elements: sdk.MLToolkit.CRF.DataPoint[] = []

    for (const intent of intents) {
      for (const utterance of intent.utterances) {
        const features: string[][] = utterance.tokens
          .filter(x => !x.isSpace)
          .map(this.tokenSliceFeatures.bind(this, intent, utterance, false))
        const labels = labelizeUtterance(utterance)

        elements.push({ features, labels })
      }
    }

    const trainer = this.mlToolkit.CRF.createTrainer()
    this._crfModelFn = await trainer.train(elements, CRF_TRAINER_PARAMS)
  }

  get serialized(): Promise<Buffer> {
    return (async () => await Promise.fromCallback(cb => fs.readFile(this._crfModelFn, cb)))() as Promise<Buffer>
  }

  private tokenSliceFeatures(
    intent: Intent<Utterance>,
    utterance: Utterance,
    isPredict: boolean,
    token: UtteranceToken
  ): string[] {
    const previous = utterance.tokens.filter(t => t.index < token.index && !t.isSpace).slice(-2)
    const next = utterance.tokens.filter(t => t.index > token.index && !t.isSpace).slice(0, 1)

    const prevFeats = previous.map(t =>
      this._getTokenFeatures(intent, utterance, t, isPredict)
        .filter(f => f.name !== 'quartile')
        .reverse()
    )
    const current = this._getTokenFeatures(intent, utterance, token, isPredict).filter(f => f.name !== 'cluster')
    const nextFeats = next.map(t =>
      this._getTokenFeatures(intent, utterance, t, isPredict).filter(f => f.name !== 'quartile')
    )

    const prevPairs = prevFeats.length
      ? featurizer.getFeatPairs(prevFeats[0], current, ['word', 'vocab', 'weight', 'POS'])
      : []
    const nextPairs = nextFeats.length
      ? featurizer.getFeatPairs(current, nextFeats[0], ['word', 'vocab', 'weight', 'POS'])
      : []

    const intentFeat = featurizer.getIntentFeature(intent)
    const bos = token.isBOS ? ['__BOS__'] : []
    const eos = token.isEOS ? ['__EOS__'] : []

    return [
      ...bos,
      featurizer.featToCRFsuiteAttr('', intentFeat),
      ..._.flatten(prevFeats.map((feat, idx) => feat.map(featurizer.featToCRFsuiteAttr.bind(this, `w[-${idx + 1}]`)))),
      ...current.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[0]')),
      ..._.flatten(nextFeats.map((feat, idx) => feat.map(featurizer.featToCRFsuiteAttr.bind(this, `w[${idx + 1}]`)))),
      ...prevPairs.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[-1]|w[0]')),
      ...nextPairs.map(featurizer.featToCRFsuiteAttr.bind(this, 'w[0]|w[1]')),
      ...eos
    ] as string[]
  }

  private _getTokenFeatures(
    intent: Intent<Utterance>,
    utterance: Utterance,
    token: UtteranceToken,
    isPredict: boolean
  ): featurizer.CRFFeature[] {
    if (!token || !token.value) {
      return []
    }

    return [
      featurizer.getTokenQuartile(utterance, token),
      featurizer.getClusterFeat(token),
      featurizer.getWordWeight(token),
      featurizer.getInVocabFeat(token, intent),
      featurizer.getSpaceFeat(utterance.tokens[token.index - 1]),
      featurizer.getAlpha(token),
      featurizer.getNum(token),
      featurizer.getSpecialChars(token),
      featurizer.getWordFeat(token, isPredict),
      featurizer.getPOSFeat(token),
      ...featurizer.getEntitiesFeats(token, intent.slot_entities, isPredict)
    ].filter(_.identity) // some features can be undefined
  }

  getSequenceFeatures(intent: Intent<Utterance>, utterance: Utterance, isPredict: boolean): string[][] {
    return _.chain(utterance.tokens)
      .filter(t => !t.isSpace)
      .map(t => this.tokenSliceFeatures(intent, utterance, isPredict, t))
      .value()
  }

  async extract(utterance: Utterance, intent: Intent<Utterance>): Promise<SlotExtractionResult[]> {
    const features = this.getSequenceFeatures(intent, utterance, true)
    debugExtract('vectorize', features)

    const predictions = this._crfTagger.marginal(features)
    debugExtract('slot crf predictions', predictions)

    return _.chain(predictions)
      .map(predictionLabelToTagResult)
      .map(tagRes => removeInvalidTagsForIntent(intent, tagRes))
      .thru(tagRess => makeExtractedSlots(intent, utterance, tagRess))
      .value() as SlotExtractionResult[]
  }
}
