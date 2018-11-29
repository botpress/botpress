import fs from 'fs'
import _ from 'lodash'
import os from 'os'
import tmp from 'tmp'

import { Tagger, Trainer } from '../../tools/crfsuite'
import FastText from '../../tools/fastText'

import { Token, tokenize } from './tagger'

const FT_DIMENTIONS = 10

type Features = {
  b_embeddings: number[] // TODO GMM class instead .. [FT_DIMENTIONS]-dimentional fastText vector
  b_upper: boolean
  b_title: boolean
  b_low: string

  a_embeddings: number[] // [FT_DIMENTIONS]-dimentional fastText vector
  a_upper: boolean
  a_low: string
  a_title: boolean

  w_embeddings: number[]
  w_upper: boolean
  w_low: string
  w_title: boolean
  w_digit: boolean
  w_bias: number
  w_eos: boolean
  w_bos: boolean
}

export default class CRFExtractor {
  private _isTrained: boolean = false
  private _ftModelFn = ''
  private _crfModelFn = ''
  private _ft!: FastText
  private _tagger!: typeof Tagger

  static samplesFromFile(filePath: string): Token[][] {
    const text = fs.readFileSync(filePath, 'utf8')
    const lines = text
      .split(os.EOL)
      .map(x => x.trim())
      .filter(x => x.length)
    return lines.map(l => tokenize(l))
  }

  async train(samples: Token[][]) {
    this._isTrained = false
    await this._trainFastText(samples)
    await this._trainCrf(samples)

    // Create the tagger
    this._tagger = Tagger()
    await this._tagger.open(this._crfModelFn)
    this._isTrained = true
  }

  async predict(sample: Token[]): Promise<string[]> {
    if (!this._isTrained) {
      throw new Error('Model not trained, please call train() before')
    }
    const seq: string[][] = []
    for (let i = 0; i < sample.length; i++) {
      const x = await this._word2feat(sample, i)
      seq.push(this._feat2vec(x))
    }
    return this._tagger.tag(seq)
  }

  private async _trainCrf(samples: Token[][]) {
    this._crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
    const trainer = Trainer()
    trainer.set_params({
      c1: '0.0001',
      c2: '0.01',
      max_iterations: '500',
      'feature.possible_transitions': '1',
      'feature.possible_states': '1'
    })

    for (const sample of samples) {
      const entries: string[][] = []
      const labels: string[] = []
      for (let i = 0; i < sample.length; i++) {
        // TODO Add sliding window here
        const x = await this._word2feat(sample, i)
        labels.push(sample[i].type)
        entries.push(this._feat2vec(x))
      }
      trainer.append(entries, labels)
    }

    await trainer.train(this._crfModelFn)
  }

  private async _trainFastText(samples: Token[][]) {
    this._ftModelFn = tmp.fileSync({ postfix: '.bin' }).name

    const ftTrainFn = tmp.fileSync({ postfix: '.txt' }).name
    this._ft = new FastText(this._ftModelFn)

    const lines: string[] = []
    for (const sample of samples) {
      const line = sample.map(x => (x.type === 'o' ? x.value : x.type)).join(' ')
      lines.push(line)
    }
    const ftTrainContent = lines.join('\n')

    fs.writeFileSync(ftTrainFn, ftTrainContent, 'utf8')
    this._ft.train(ftTrainFn, {
      method: 'skipgram',
      minCount: 2,
      bucket: 25000,
      dim: 3,
      learningRate: 0.1,
      wordGram: 3,
      maxn: 6,
      minn: 2,
      epoch: 500
    })
  }

  private async _word2feat(tokens: Token[], idx: number): Promise<Features> {
    const feat: Features = {
      a_embeddings: new Array(FT_DIMENTIONS).fill(0),
      a_low: '',
      a_title: false,
      a_upper: false,
      b_embeddings: new Array(FT_DIMENTIONS).fill(0),
      b_low: '',
      b_title: false,
      b_upper: false,
      w_bias: 1.0,
      w_bos: false,
      w_embeddings: new Array(FT_DIMENTIONS).fill(0),
      w_eos: false,
      w_digit: false,
      w_low: '',
      w_title: false,
      w_upper: false
    }

    if (idx === 0) {
      feat.w_bos = true
    } else {
      const t = tokens[idx - 1].value
      feat.b_low = t.toLowerCase()
      feat.b_upper = t === t.toUpperCase()
      feat.b_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]
      feat.b_embeddings = await this._ft.wordVectors(t)
    }

    if (idx === tokens.length - 1) {
      feat.w_eos = true
    } else {
      const t = tokens[idx + 1].value
      feat.a_low = t.toLowerCase()
      feat.a_upper = t === t.toUpperCase()
      feat.a_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]
      feat.a_embeddings = await this._ft.wordVectors(t)
    }

    const t = tokens[idx].value
    feat.w_digit = /^\d+$/i.test(t)
    feat.w_low = t.toLowerCase()
    feat.w_embeddings = await this._ft.wordVectors(t)
    feat.w_upper = t === t.toUpperCase()
    feat.w_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]

    return feat
  }

  private _feat2vec(f: Features): string[] {
    const ret: string[] = []

    if (f.w_bos) {
      ret.push('w[0]bos')
    } else {
      ret.push('w[-1]=' + f.b_low)
      f.b_title && ret.push('w[-1]title')
      f.b_upper && ret.push('w[-1]upper')
      // TODO Add word embedding cluster here
    }

    if (f.w_eos) {
      ret.push('w[0]eos')
    } else {
      ret.push('w[1]=' + f.a_low)
      f.a_title && ret.push('w[1]title')
      f.a_upper && ret.push('w[1]upper')
      // TODO Add word embedding cluster here
    }

    ret.push('w[0]biais=' + f.w_bias)
    f.w_digit && ret.push('w[0]digit')
    f.w_title && ret.push('w[0]title')
    f.w_upper && ret.push('w[0]upper')
    // TODO Add word embedding cluster here

    return ret
  }
}
