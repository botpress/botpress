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

export type XValidationResults = {
  intents: _.Dictionary<F1>
  slots: F1
}

export interface TestingAPI {
  fetchTests: () => Promise<Test[]>
  fetchIntents: () => Promise<any[]>
  updateTest: (x: Test) => Promise<void>
  deleteTest: (x: Test) => Promise<void>
  runTest: (x: Test) => Promise<TestResult>
  computeCrossValidation: (lang: string) => Promise<XValidationResults>
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

    computeCrossValidation: async (lang: string) => {
      const { data } = await bp.axios.post(`/mod/nlu/cross-validation/${lang}`)
      return data
    }
  }
}
