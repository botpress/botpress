import { ContextPrediction, IntentPrediction } from '@botpress/nlu-client'

export function isNotNil<T>(input: T | null | undefined): input is T {
  return input !== null && input !== undefined
}

export function isRecord(input: unknown): input is Record<string, unknown> {
  return isNotNil(input) && typeof input === 'object' && !Array.isArray(input)
}

export type ContextPredictionExtended = Omit<ContextPrediction, 'name'> | ContextPrediction
export function isContextPrediction(input: unknown): input is ContextPredictionExtended {
  return isRecord(input) && 'confidence' in input && 'oos' in input && 'intents' in input
}

export function isIntentPrediction(input: unknown): input is IntentPrediction {
  return (
    isRecord(input) &&
    ('name' in input || 'label' in input) &&
    'confidence' in input &&
    'extractor' in input &&
    'slots' in input
  )
}
