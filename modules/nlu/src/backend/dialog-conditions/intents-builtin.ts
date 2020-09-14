import { Condition } from 'botpress/sdk'
import _ from 'lodash'

import userIntentIs from './intent-is'

export const userIntentYes: Condition = {
  id: 'user_intent_yes',
  hidden: true,
  label: 'User intention is positive',
  evaluate: event => {
    return userIntentIs.evaluate(event, { topicName: 'global', intentName: 'yes' })
  }
}

export const userIntentNo: Condition = {
  id: 'user_intent_no',
  label: 'User intention is negative',
  hidden: true,
  evaluate: event => {
    return userIntentIs.evaluate(event, { topicName: 'global', intentName: 'no' })
  }
}

export const userIntentCancel: Condition = {
  id: 'user_intent_cancel',
  label: 'User wants to cancel',
  hidden: true,
  evaluate: event => {
    return userIntentIs.evaluate(event, { topicName: 'global', intentName: 'cancel' })
  }
}
