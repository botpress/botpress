import { IO } from 'botpress/sdk'
export type Condition = ['intent' | 'slot' | 'context', 'is', string]

export interface Test {
  id: string
  utterance: string
  context: string
  conditions: Condition[]
}

export interface CSVTest {
  Context: string
  Utterance: string
  Intent: string
}

export interface TestResultDetails {
  type: 'slot' | 'slotCount' | 'intent' | 'context'
  success: boolean
  reason: string
  expected: string
  received: string
}

export interface TestResult {
  id: string
  success: boolean
  details: TestResultDetails[]
  nlu: IO.EventUnderstanding
}

export interface VisData {
  expected: string
  predicted: string
}

export interface DataResult {
  intent: VisData[]
  slot: VisData[]
  context: VisData[]
  slotCount: VisData[]
}
