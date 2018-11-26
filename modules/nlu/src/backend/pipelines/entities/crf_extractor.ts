import fs from 'fs'
import _ from 'lodash'
import os from 'os'
import path from 'path'
import tmp from 'tmp'

import { Tagger, Trainer } from '../../tools/crfsuite'
import FastText from '../../tools/fastText'

import { Token, tokenize } from './tagger'

const FT_DIMENTIONS = 10

type RecordCallback = (expected: string, actual: string) => void

type F1 = {
  tp: { [cls: string]: number }
  fp: { [cls: string]: number }
  fn: { [cls: string]: number }
}

type SuiteResult = {
  label: string
  f1: number
  precision: number
  recall: number
}

class FiveFolder<T> {
  constructor(private readonly dataset: T[]) {}

  results: { [suite: string]: F1 } = {}

  async fold(
    suiteName: string,
    trainFn: ((trainSet: T[]) => Promise<void>),
    evaluateFn: ((testSet: T[], record: RecordCallback) => Promise<void>)
  ) {
    this.results[suiteName] = { fp: {}, tp: {}, fn: {} }
    const shuffled = _.shuffle(this.dataset)
    const chunks = _.chunk(shuffled, 5)

    for (const chunk of chunks) {
      const train = _.flatten(chunks.filter(c => c !== chunk))
      await trainFn([...train])
      await evaluateFn([...chunk], this._record(suiteName))
    }
  }

  _record = suiteName => (expected: string, actual: string) => {
    const { tp, fp, fn } = this.results[suiteName]
    if (expected === actual) {
      tp[expected] = (tp[expected] || 0) + 1
    } else {
      fp[actual] = (fp[actual] || 0) + 1
      fn[expected] = (fn[expected] || 0) + 1
    }
  }

  getResults() {
    console.log(this.results)
    for (const suite in this.results) {
      const classes = _.uniq([
        ..._.keys(this.results[suite].fp),
        ..._.keys(this.results[suite].tp),
        ..._.keys(this.results[suite].fn)
      ])
      const result: SuiteResult[] = []
      for (const cls of classes) {
        const precision =
          (this.results[suite].tp[cls] || 0) / ((this.results[suite].tp[cls] || 0) + (this.results[suite].fp[cls] || 0))
        const recall =
          (this.results[suite].tp[cls] || 0) / ((this.results[suite].tp[cls] || 0) + (this.results[suite].fn[cls] || 0))
        const f1 = 2 * ((precision * recall) / (precision + recall))
        result.push({ label: cls, precision, recall, f1 })
      }
      console.log(result)
    }
  }
}

type FeatureSet = {
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

const word2feat = async (tokens: Token[], idx: number, getWordVector): Promise<FeatureSet> => {
  const feat: FeatureSet = {
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
    feat.b_embeddings = await getWordVector(t)
  }

  if (idx === tokens.length - 1) {
    feat.w_eos = true
  } else {
    const t = tokens[idx + 1].value
    feat.a_low = t.toLowerCase()
    feat.a_upper = t === t.toUpperCase()
    feat.a_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]
    feat.a_embeddings = await getWordVector(t)
  }

  const t = tokens[idx].value
  feat.w_digit = /^\d+$/i.test(t)
  feat.w_low = t.toLowerCase()
  feat.w_embeddings = await getWordVector(t)
  feat.w_upper = t === t.toUpperCase()
  feat.w_title = t.length >= 2 && t[0].toUpperCase() === t[0] && t[1].toLowerCase() === t[1]

  return feat
}

const feat2vec = (f: FeatureSet): string[] => {
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

const text = fs.readFileSync(path.resolve(__dirname, './stubs/dataset.txt'), 'utf8')
const lines = text
  .split(os.EOL)
  .map(x => x.trim())
  .filter(x => x.length)
const samples = lines.map(l => tokenize(l))

let ftModelFn = ''
let crfModelFn = ''
let ft: FastText

export default async function run() {
  const newTest = new FiveFolder(samples)

  await newTest.fold(
    'Experiment 1',
    async training => {
      ftModelFn = tmp.fileSync({ postfix: '.bin' }).name
      crfModelFn = tmp.fileSync({ postfix: '.bin' }).name
      const ftTrainFn = tmp.fileSync({ postfix: '.txt' }).name
      ft = new FastText(ftModelFn)

      const lines: string[] = []
      for (const sample of training) {
        const line = sample.map(x => (x.type === 'o' ? x.value : x.type)).join(' ')
        lines.push(line)
      }
      const ftTrainContent = lines.join('\n')

      fs.writeFileSync(ftTrainFn, ftTrainContent, 'utf8')
      ft.train(ftTrainFn, {
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

      const trainer = Trainer()
      trainer.set_params({
        c1: '0.0001',
        c2: '0.01',
        max_iterations: '500',
        'feature.possible_transitions': '1',
        'feature.possible_states': '1'
      })

      console.log('Before Training')

      for (const sample of training) {
        const entries: string[][] = []
        const labels: string[] = []
        for (let i = 0; i < sample.length; i++) {
          // TODO Add sliding window here
          console.log('BEOFRE FT', sample[i])
          const x = await word2feat(sample, i, word => ft.wordVectors(word))
          labels.push(sample[i].type)
          entries.push(feat2vec(x))
          console.log('AFTER FT', sample[i])
        }
        trainer.append(entries, labels)
      }

      await trainer.train(crfModelFn)
    },
    async (test, record) => {
      const tagger = Tagger()
      console.log(test[0])
      await tagger.open(crfModelFn)
      for (const sample of test) {
        const seq: string[][] = []
        const expected: string[] = []
        for (let i = 0; i < sample.length; i++) {
          const x = await word2feat(sample, i, word => ft.wordVectors(word))
          seq.push(feat2vec(x))
          expected.push(sample[i].type)
        }
        const tags: string[] = tagger.tag(seq)
        const results = _.zip(expected, tags)

        results.forEach(c => {
          record(c[0]!, c[1]!)
        })
      }
    }
  )
  console.log('ALL DONE')
  console.log(newTest.getResults())
}
