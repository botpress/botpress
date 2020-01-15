export type Condition = ['intent' | 'slot', 'is', string]

export interface Test {
  id: string
  utterance: string
  context: string
  conditions: Condition[]
}

export interface TestResult {
  success: boolean
  reason?: string
  expected: string
  received: string | undefined
}

export interface CSVTest {
  Context: string
  Utterance: string
  Intent: string
}

export interface TestResult {
  id: string
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
