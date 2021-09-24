import { ContextPrediction, IntentPrediction } from '@botpress/nlu-client'
import { isRecord } from 'common/type-coersion'

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
