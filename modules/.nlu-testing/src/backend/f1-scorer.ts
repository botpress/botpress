import _ from 'lodash'

export interface Scorer<T> {
  record: (actual: any, expected: any) => void
  getResults: () => T
  // TODO add evaluate with X[] and Y[]?
}

export interface F1 {
  precision: number
  recall: number
  f1: number
}

interface ClassRecords {
  tp: number
  fp: number
  fn: number
}
type Comparator = (actual: any, expected: any) => boolean

const defaultCompare: Comparator = (a, b) => a === b

export default class MultiClassF1Scorer implements Scorer<F1> {
  private recordsMap: _.Dictionary<ClassRecords>

  constructor(private compare: Comparator = defaultCompare) {
    this.recordsMap = {}
  }

  record(actual: string, expected: string) {
    if (this.compare(actual, expected)) {
      const tp = _.get(this.recordsMap, `${actual}.tp`, 0) as number
      _.set(this.recordsMap, `${actual}.tp`, tp + 1)[actual].tp = tp + 1
    } else {
      const fn = _.get(this.recordsMap, `${expected}.fn`, 0) as number
      const fp = _.get(this.recordsMap, `${actual}.fp`, 0) as number
      _.set(this.recordsMap, `${expected}.fn`, fn + 1)
      _.set(this.recordsMap, `${actual}.fp`, fp + 1)
    }
  }

  getClassResults(cls): F1 {
    const { tp, fp, fn } = { tp: 0, fp: 0, fn: 0, ...this.recordsMap[cls] }
    const precision = tp === 0 ? 0 : tp / (tp + fp)
    const recall = tp === 0 ? 0 : tp / (tp + fn)
    const f1 = precision === 0 || recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
    return { precision, recall, f1 }
  }

  // We use macro-F1 at the moment, offer options for micro-F1 and weighted-F1
  getResults() {
    const clsF1 = Object.keys(this.recordsMap).map(this.getClassResults.bind(this))
    return {
      precision: _.round(_.meanBy(clsF1, 'precision'), 2),
      recall: _.round(_.meanBy(clsF1, 'recall'), 2),
      f1: _.round(_.meanBy(clsF1, 'f1'), 2)
    }
  }
}
