import { Intent as BpIntent, Tag } from '@blueprintjs/core'
import _ from 'lodash'
import React, { Fragment } from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

export interface IntentDef {
  name: string
  confidence?: number
}

export const Intent = (props: { intent: IntentDef; elected: boolean }) => {
  const { intent, elected } = props
  const isQnA = intent.name.startsWith(QNA_IDENTIFIER)

  const displayName = isQnA ? _.last(intent.name.split('_')) : intent.name

  const condidenceText = intent.confidence ? `: ${formatConfidence(intent.confidence)} %` : ''
  const textContent: string = displayName + condidenceText
  const content = elected ? <strong>{textContent}</strong> : <span>{textContent}</span>

  return (
    <Fragment>
      <Tag intent={isQnA ? BpIntent.SUCCESS : BpIntent.PRIMARY} minimal>
        {isQnA ? 'QnA' : 'NLU'}
      </Tag>
      &nbsp;
      <a onClick={navigateToIntentDefinition(intent.name, isQnA)}>{content}</a>
    </Fragment>
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
