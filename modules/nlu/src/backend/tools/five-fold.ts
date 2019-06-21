import _ from 'lodash'
import { promises } from 'fs'
import { stringify } from 'querystring'

export type RecordCallback = (expected: string, actual: string) => void

export interface ConfusionMap {
  [cls: string]: Map<string, number>
}

export interface F1 {
  tp: { [cls: string]: number }
  fp: { [cls: string]: number }
  fn: { [cls: string]: number }
  confusions: ConfusionMap
}

const MapProxy = {
  get: function(target, prop) {
    if (typeof target[prop] === 'undefined') {
      target[prop] = new Map<string, number>()
    }
    return target[prop]
  }
}

const ZeroProxy = {
  get: function(target, prop) {
    return target[prop] || 0
  }
}

export interface SuiteResult {
  tp: number
  fp: number
  fn: number
  precision: number
  recall: number
  f1: number
}

export type Result = { [suite: string]: { [cls: string]: SuiteResult } }

export class FiveFolder<T> {
  constructor(private readonly dataset: T[][]) {}

  results: { [suite: string]: F1 } = {}

  private readonly N = 3

  async fold(
    suiteName: string,
    trainFn: (trainSet: T[]) => Promise<void>,
    evaluateFn: (trainSet: T[], testSet: T[], record: RecordCallback) => Promise<void>
  ) {
    this.results[suiteName] = {
      fp: new Proxy({}, ZeroProxy),
      tp: new Proxy({}, ZeroProxy),
      fn: new Proxy({}, ZeroProxy),
      confusions: new Proxy({}, MapProxy)
    }

    const trainingPromises = _.chain(this.dataset)
      .map(intentUtterances => _.shuffle(intentUtterances))
      .map(intentUtterances => _.chunk(intentUtterances, Math.ceil(intentUtterances.length / this.N)))
      .map(chunckedUtterances => _.shuffle(chunckedUtterances))
      .zip()
      .flatten()
      .unzip()
      .value()
      .map(fold => fold.reduce((a, b) => a.concat(b), []))
      .map(async (testSet, index, arr) => {
        const trainSet = _.flatten([...arr.slice(0, index), ...arr.slice(index + 1, arr.length)])
        await trainFn([...trainSet])
        await evaluateFn([...trainSet], [...testSet], this._record(suiteName))
      })

    await Promise.all(trainingPromises)
  }

  _record = suiteName => (expected: string, actual: string) => {
    const { tp, fp, fn, confusions } = this.results[suiteName]
    if (expected === actual) {
      tp[expected] = tp[expected] + 1
    } else {
      fp[actual] = fp[actual] + 1
      fn[expected] = fn[expected] + 1
      confusions[expected].set(actual, (confusions[expected].get(actual) || 0) + 1)
    }
  }

  getResults(): Result {
    const ret: Result = {}
    for (const suite in this.results) {
      const classes = _.uniq([
        ...Object.keys(this.results[suite].fp),
        ...Object.keys(this.results[suite].tp),
        ...Object.keys(this.results[suite].fn)
      ])

      const result: { [cls: string]: SuiteResult } = {}

      for (const cls of classes) {
        const confusions = serializeMap(this.results[suite].confusions[cls])
        const precision = this.results[suite].tp[cls] / (this.results[suite].tp[cls] + this.results[suite].fp[cls])
        const recall = this.results[suite].tp[cls] / (this.results[suite].tp[cls] + this.results[suite].fn[cls])
        const f1 = 2 * ((precision * recall) / (precision + recall))
        result[cls] = new Proxy(
          {
            tp: this.results[suite].tp[cls],
            fp: this.results[suite].fp[cls],
            fn: this.results[suite].fn[cls],
            samples: this.results[suite].tp[cls] + this.results[suite].fn[cls],
            confusions: confusions,
            precision: isNaN(precision) ? 0 : precision,
            recall: isNaN(recall) ? 0 : recall,
            f1: isNaN(f1) ? 0 : f1
          },
          ZeroProxy
        )
      }

      const v = _.values(result)
      result['all'] = {
        f1: _.meanBy(v, 'f1'),
        precision: _.meanBy(v, 'precision'),
        recall: _.meanBy(v, 'recall'),
        tp: 0,
        fp: 0,
        fn: 0
      }
      ret[suite] = result
    }

    return ret
  }
}

function serializeMap(map: Map<string, number>): any {
  return Array.from(map.entries()).reduce((acc, curr) => {
    acc[curr[0]] = curr[1]
    return acc
  }, {})
}
