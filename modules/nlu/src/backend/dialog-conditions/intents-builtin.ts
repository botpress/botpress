import { Condition } from 'botpress/sdk'
import _ from 'lodash'

import userIntentIs from './intent-is'

export const userIntentYes: Condition = {
  id: 'user_intent_yes',
  label: 'User intention is positive',
  evaluate: event => {
    return userIntentIs.evaluate(event, { topicName: 'global', intentName: 'yes' })
  }
}

export const userIntentNo: Condition = {
  id: 'user_intent_no',
  label: 'User intention is negative',
  evaluate: event => {
    return userIntentIs.evaluate(event, { topicName: 'global', intentName: 'no' })
  }
}

export const userIntentCancel: Condition = {
  id: 'user_intent_cancel',
  label: 'User wants to cancel',
  evaluate: event => {
    return userIntentIs.evaluate(event, { topicName: 'global', intentName: 'cancel' })
  }
}
