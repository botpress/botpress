import _ from 'lodash'
import React from 'react'

import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

export interface IntentDef {
  name: string
  confidence: number
}

export const Intent = (props: { intent: IntentDef; elected: boolean }) => {
  const { intent, elected } = props
  const isQnA = intent.name.startsWith(QNA_IDENTIFIER)

  let content: string | JSX.Element = `${intent.name}: ${formatConfidence(intent.confidence)} %`
  if (elected) {
    content = <strong>{content}</strong>
  }
  return (
    <li>
      <a onClick={navigateToIntentDefinition(intent.name, isQnA)}>{content}</a>
    </li>
  )
}

const navigateToIntentDefinition = (intent: string, isQna: boolean) => () => {
  intent = isQna ? intent.replace(QNA_IDENTIFIER, '') : intent
  let url
  if (isQna) {
    url = `/modules/qna?id=${intent}`
  } else {
    url = intent === 'none' ? '/modules/nlu' : `/modules/nlu?type=intent&id=${intent}`
  }
  window.parent.postMessage({ action: 'navigate-url', payload: url }, '*')
}
