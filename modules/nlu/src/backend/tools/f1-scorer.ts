import _ from 'lodash'

export interface Scorer<T> {
  record: (actual: any, expected: any) => void
  getResults: () => T
  // TODO add evaluate with X[] and Y[]?
}

type F1 = { precision: number; recall: number; f1: number }
type classRecords = { tp: number; fp: number; fn: number }
type Comparator = (actual: any, expected: any) => boolean

const defaultCompare: Comparator = (a, b) => a === b

const clsRecordsProxy = {
  get: (target: any, prop: string): classRecords => target[prop] || { tp: 0, fp: 0, fn: 0 }
}

// TODO add options which impacts on how F1 is computed on multiclass problem
export default class MultiClassF1Scorer implements Scorer<F1> {
  private recordsMap: Dic<classRecords>

  constructor(private compare: Comparator = defaultCompare) {
    this.recordsMap = {}
  }

  record(actual: string, expected: string) {
    if (this.compare(actual, expected)) {
      const tp = _.get(this.recordsMap, `${actual}.tp`, 0) as number
      _.set(this.recordsMap, `${actual}.tp`, tp + 1)[actual].tp = tp + 1
    } else {
      const fn = _.get(this.recordsMap, `${actual}.fn`, 0) as number
      const fp = _.get(this.recordsMap, `${actual}.fp`, 0) as number
      _.set(this.recordsMap, `${actual}.fn`, fn + 1)
      _.set(this.recordsMap, `${actual}.fp`, fp + 1)
    }
  }

  getClassResults(cls): F1 {
    const { tp, fp, fn } = { tp: 0, fp: 0, fn: 0, ...this.recordsMap[cls] }
    const precision = tp / (tp + fp)
    const recall = tp / (tp + fn)
    const f1 = (2 * precision * recall) / (precision + recall)
    return { precision, recall, f1 }
  }

  // We use macro F1 at the moment
  getResults() {
    const clsF1 = Object.keys(this.recordsMap).map(this.getClassResults.bind(this))
    return {
      precision: _.meanBy(clsF1, 'precision'),
      recall: _.meanBy(clsF1, 'recall'),
      f1: _.meanBy(clsF1, 'f1')
    }
  }
}
