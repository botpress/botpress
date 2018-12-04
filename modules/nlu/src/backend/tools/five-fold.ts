import _ from 'lodash'

export type RecordCallback = (expected: string, actual: string) => void

export type F1 = {
  tp: { [cls: string]: number }
  fp: { [cls: string]: number }
  fn: { [cls: string]: number }
}

export interface SuiteResult {
  tp: number,
  fp: number,
  fn: number,
  precision: number
  recall: number
  f1: number
}

export type Result = { [suite: string]: { [cls: string]: SuiteResult } }

export class FiveFolder<T> {
  constructor(private readonly dataset: T[]) { }

  results: { [suite: string]: F1 } = {}

  async fold(
    suiteName: string,
    trainFn: ((trainSet: T[]) => Promise<void>),
    evaluateFn: ((testSet: T[], record: RecordCallback) => Promise<void>)
  ) {
    this.results[suiteName] = { fp: {}, tp: {}, fn: {} }
    const shuffled = _.shuffle(this.dataset)
    const chunks = _.chunk(shuffled, Math.ceil(shuffled.length / 2))

    await Promise.mapSeries(chunks, async testSet => {
      const trainSet = _.flatten(chunks.filter(c => c !== testSet))
      await trainFn([...trainSet])
      await evaluateFn([...testSet], this._record(suiteName))
    })
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

  getResults(): Result {
    const ret: Result = {}
    for (const suite in this.results) {
      const classes = _.uniq([
        ..._.keys(this.results[suite].fp),
        ..._.keys(this.results[suite].tp),
        ..._.keys(this.results[suite].fn)
      ])

      const result: { [cls: string]: SuiteResult } = {}

      for (const cls of classes) {
        const precision =
          (this.results[suite].tp[cls] || 0) / ((this.results[suite].tp[cls] || 0) + (this.results[suite].fp[cls] || 0))
        const recall =
          (this.results[suite].tp[cls] || 0) / ((this.results[suite].tp[cls] || 0) + (this.results[suite].fn[cls] || 0))
        const f1 = 2 * ((precision * recall) / (precision + recall))
        if (this.results[suite].tp[cls] + this.results[suite].fn[cls] >= 5) {
          result[cls] = { tp: this.results[suite].tp[cls], fp: this.results[suite].fp[cls], fn: this.results[suite].fn[cls], precision, recall, f1 }
        }
      }

      const v = _.values(result)
      result['all'] = { f1: _.meanBy(v, 'f1'), precision: _.meanBy(v, 'precision'), recall: _.meanBy(v, 'recall'), tp: 0, fp: 0, fn: 0 }
      ret[suite] = result
    }

    return ret
  }
}
