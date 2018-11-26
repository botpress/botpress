import _ from 'lodash'

export type RecordCallback = (expected: string, actual: string) => void

export type F1 = {
  tp: { [cls: string]: number }
  fp: { [cls: string]: number }
  fn: { [cls: string]: number }
}

export interface SuiteResult {
  precision: number
  recall: number
  f1: number
}

export type Result = { [suite: string]: { [cls: string]: SuiteResult } }

export class FiveFolder<T> {
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
        result[cls] = { precision, recall, f1 }
      }

      const v = _.values(result)
      result['all'] = { f1: _.meanBy(v, 'f1'), precision: _.meanBy(v, 'precision'), recall: _.meanBy(v, 'recall') }
      ret[suite] = result
    }

    return ret
  }
}
