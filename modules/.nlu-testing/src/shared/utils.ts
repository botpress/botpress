import _ from 'lodash'

import { Test, TestResult } from './typings'

export function computeSummary(tests: Test[], testResults: _.Dictionary<TestResult>): number {
  const passedCount = Object.values(testResults).filter(res => res.success).length
  return _.round((passedCount / tests.length) * 100, 1)
}
