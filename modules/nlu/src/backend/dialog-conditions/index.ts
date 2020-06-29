import extractedEntity from './extracted-entity'
import intentAmbiguous from './intent-ambiguous'
import intentIs from './intent-is'
import { userIntentCancel, userIntentNo, userIntentYes } from './intents-builtin'
import misunderstood from './misunderstood'
import topicAmbiguous from './topic-ambiguous'

export default [
  intentIs,
  misunderstood,
  intentAmbiguous,
  topicAmbiguous,
  extractedEntity,
  userIntentCancel,
  userIntentNo,
  userIntentYes
]
