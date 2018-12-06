import fs from 'fs'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import tmp from 'tmp'

import { Tagger, Trainer } from '../../tools/crfsuite'
import FastText from '../../tools/fastText'
import { SlotExtractor } from '../../typings'

import { Token, tokenize } from './tagger'

const FT_DIMENTIONS = 15
const K_CLUSTERS = 15
const CRF_TRAINER_PARAMS = {
  c1: '0.0001',
  c2: '0.01',
  max_iterations: '500',
  'feature.possible_transitions': '1',
  'feature.possible_states': '1',
}

type Features = Partial<{
  b_cluster: number
  b_upper: boolean
  b_title: boolean
  b_low: string

  a_cluster: number
  a_upper: boolean
  a_low: string
  a_title: boolean

  w_upper: boolean
  w_low: string
  w_title: boolean
  w_digit: boolean
  w_bias: number
  w_eos: boolean
  w_bos: boolean
}>

export default class CRFExtractor implements SlotExtractor {
  private _isTrained: boolean = false
  private _ftModelFn = ''
  private _crfModelFn = ''
  private _ft!: FastText
  private _tagger!: typeof Tagger
  private _kmeansModel

  async train(inputs: string[]) {
    this._isTrained = false
    const samples = inputs.map(s => tokenize(s))
    await this._trainFastText(samples)
    await this._trainKmeans(samples)
    await this._trainCrf(samples)

    this._tagger = Tagger()
    await this._tagger.open(this._crfModelFn)
    this._isTrained = true
  }

  async extract(text: string): Promise<any> {
    const tokens = tokenize(text, false)
    const tags = await this.tag(tokens)

    return _.zip(tokens, tags)
      .filter(tokTag => tokTag[1] != 'o')
      .reduce((slots: any, [token, tag]) => {
        if (token && tag) {
          const slotName = tag.slice(2)
          if (tag[0] === 'I' && slots[slotName]) {
            slots[slotName] + ` ${token.value}`
          } else if (tag[0] === 'B' && slots[slotName]) {
            if (Array.isArray(slots[slotName])) slotName[slotName].push(token.value)
            else slots[slotName] = [slots[slotName], token.value]
          } else {
            slots[slotName] = token.value
          }
          return slots
        }
      }, {})
  }

  async tag(sample: Token[]): Promise<string[]> {
    if (!this._isTrained) {
      throw new Error('Model not trained, please call train() before')
    }
    const seq: string[][] = []
    for (let i = 0; i < sample.length; i++) {
      const x = await this._word2feat(sample, i)
      seq.push(this._featuresToTaggerParams(x))
    }
    // Here, it would be awesome if we could get some probabilities for each tag
    // CRFSuite offers that option by passing the -i, --marginal option
    // From the docs: Output the marginal probabilities of labels. When this function is enabled, each predicted label is followed by ":x.xxxx", where "x.xxxx" presents the probability of the label. This function is disabled by default.

    return this._tagger.tag(seq)
  }

  private async _trainKmeans(samples: Token[][]): Promise<any> {
    const data = await Promise.mapSeries(_.flatten(samples), async t => await this._ft.wordVectors(t.value))
    try {
      this._kmeansModel = kmeans(data, K_CLUSTERS)
    } catch (error) {
      console.error('error tra ining Kmeans', error)
      throw error
    }
  }

  private async _trainCrf(samples: Token[][]) {
    this._crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const trainer = Trainer()
    trainer.set_params(CRF_TRAINER_PARAMS)

    for (const sample of samples) {
      const entries: string[][] = []
      const labels: string[] = []
      for (let i = 0; i < sample.length; i++) {
        const x = await this._word2feat(sample, i)
        labels.push(sample[i].type)
        entries.push(this._featuresToTaggerParams(x))
      }
      trainer.append(entries, labels)
    }

    trainer.train(this._crfModelFn, '-q')
  }

  private async _trainFastText(samples: Token[][]) {
    this._ftModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const ftTrainFn = tmp.fileSync({ postfix: '.txt' }).name
    this._ft = new FastText(this._ftModelFn)

    const trainContent = samples.reduce((corpus, example) => {
      const cannonicSentence = example.map(s => {
        if (s.type === 'o') return s.value
        else return s.type.slice(2)
      }).join(' ') // TODO replace this by the opposite tokenizer as only latin language use \s...
      return `${corpus}${cannonicSentence}}\n`
    }, '')

    fs.writeFileSync(ftTrainFn, trainContent, 'utf8')
    this._ft.train(ftTrainFn, {
      method: 'skipgram',
      minCount: 2,
      bucket: 25000,
      dim: FT_DIMENTIONS,
      learningRate: 0.5,
      wordGram: 3,
      maxn: 6,
      minn: 2,
      epoch: 50
    })
  }

  private async _word2feat(tokens: Token[], idx: number): Promise<Features> {
    const feat: Features = {}

    if (idx === 0) {
      feat.w_bos = true
    } else {
      const t = tokens[idx - 1].value
      feat.b_low = t.toLowerCase()
      feat.b_upper = t === t.toUpperCase()
      feat.b_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]
      feat.b_cluster = await this._getWordCluster(t)
    }

    if (idx === tokens.length - 1) {
      feat.w_eos = true
    } else {
      const t = tokens[idx + 1].value
      feat.a_low = t.toLowerCase()
      feat.a_upper = t === t.toUpperCase()
      feat.a_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]
      feat.a_cluster = await this._getWordCluster(t)
    }

    const t = tokens[idx].value
    feat.w_digit = /^\d+$/i.test(t)
    feat.w_low = t.toLowerCase()
    feat.w_upper = t === t.toUpperCase()
    feat.w_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]

    return feat
  }

  private async _getWordCluster(word: string): Promise<number> {
    const vector = await this._ft.wordVectors(word)
    return this._kmeansModel.nearest([vector])[0]
  }

  private _featuresToTaggerParams(f: Features): string[] {
    const ret: string[] = []

    if (f.w_bos) {
      ret.push('w[0]bos')
    } else {
      ret.push('w[-1]=' + f.b_low)
      f.b_title && ret.push('w[-1]title')
      f.b_upper && ret.push('w[-1]upper')
      ret.push(`w[-1]cluster=${f.b_cluster!.toString()}`)
    }

    if (f.w_eos) {
      ret.push('w[0]eos')
    } else {
      ret.push('w[1]=' + f.a_low)
      f.a_title && ret.push('w[1]title')
      f.a_upper && ret.push('w[1]upper')
      ret.push(`w[1]cluster=${f.a_cluster!.toString()}`)
    }

    ret.push('w[0]biais=' + f.w_bias)
    f.w_digit && ret.push('w[0]digit')
    f.w_title && ret.push('w[0]title')
    f.w_upper && ret.push('w[0]upper')

    return ret
  }
}
