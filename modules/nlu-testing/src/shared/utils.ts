import { Test, TestResult } from './typings'

export function computeSummary(tests: Test[], testResults: _.Dictionary<TestResult>): number {
  const passedCount = Object.values(testResults).filter(res => res.success).length
  return passedCount / tests.length
}
