import _ from 'lodash'

import { TestResult, VisData } from './typings'

export const computeSummary = (testResults: _.Dictionary<TestResult>): number => {
  const passedCount = Object.values(testResults).filter(res => res.success).length
  return _.round((passedCount / Object.values(testResults).length) * 100, 1)
}

export const computeAccuracy = (datas: VisData[]) => {
  const total = datas.reduce((acc: number, curr: VisData) => {
    if (curr.expected === curr.predicted) {
      acc++
    }
    return acc
  }, 0)

  return _.round((total / datas.length) * 100, 1)
}
