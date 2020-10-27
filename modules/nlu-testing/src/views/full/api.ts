import { AxiosInstance } from 'axios'
import _ from 'lodash'

import { Test, TestResult } from '../../shared/typings'

export interface TestingAPI {
  fetchTests: () => Promise<Test[]>
  fetchIntents: () => Promise<any[]>
  updateTest: (x: Test) => Promise<void>
  deleteTest: (x: Test) => Promise<void>
  runTest: (x: Test) => Promise<TestResult>
  runAllTests: () => Promise<_.Dictionary<TestResult>>
  exportResults: (results: _.Dictionary<TestResult>) => Promise<void>
}

export const makeApi = (bp: { axios: AxiosInstance }): TestingAPI => {
  return {
    fetchTests: async () => {
      const { data } = await bp.axios.get('/mod/nlu-testing/tests')
      return data as Test[]
    },

    fetchIntents: async () => {
      const { data } = await bp.axios.get('/nlu/intents')
      return data
    },

    deleteTest: async (test: Test) => {
      await bp.axios.delete(`/mod/nlu-testing/tests/${test.id}`)
    },

    updateTest: async (test: Test) => {
      await bp.axios.post(`/mod/nlu-testing/tests/${test.id}`, test)
    },

    runTest: async (test: Test): Promise<TestResult> => {
      const { data } = await bp.axios.post(`/mod/nlu-testing/tests/${test.id}/run`)
      return data
    },

    runAllTests: async (): Promise<_.Dictionary<TestResult>> => {
      const { data } = await bp.axios.post('/mod/nlu-testing/runAll')
      return data
    },

    exportResults: async (results: _.Dictionary<TestResult>) => {
      results = _.chain(results)
        .toPairs()
        .map(([key, val]) => [key, _.pick(val, 'success')])
        .fromPairs()
        .value()

      await bp.axios.post('/mod/nlu-testing/export', { results })
    }
  }
}
