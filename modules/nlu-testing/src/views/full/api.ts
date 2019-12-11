import { AxiosInstance } from 'axios'

export interface Test {
  id: string
  utterance: string
  context: string
  conditions: [string, string, string][]
}

export interface TestResult {
  id: number
  success: boolean
  details: {
    success: boolean
    reason: string
    expected: string
    received: string
  }[]
}

export interface F1 {
  precision: number
  recall: number
  f1: number
}

export type F1Metrics = _.Dictionary<F1>

export interface TestingAPI {
  fetchTests: () => Promise<Test[]>
  fetchIntents: () => Promise<any[]>
  updateTest: (x: Test) => Promise<void>
  deleteTest: (x: Test) => Promise<void>
  runTest: (x: Test) => Promise<TestResult>
  runF1Analysis: (lang: string) => Promise<F1Metrics>
}

export const makeApi = (bp: { axios: AxiosInstance }): TestingAPI => {
  return {
    fetchTests: async () => {
      const { data } = await bp.axios.get(`/mod/nlu-testing/tests`)
      return data as Test[]
    },

    fetchIntents: async () => {
      const { data } = await bp.axios.get('/mod/nlu/intents')
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

    runF1Analysis: async (lang: string) => {
      // TODO add lang as req params
      const { data } = await bp.axios.post(`/mod/nlu/confusion`)
      return data
    }
  }
}
