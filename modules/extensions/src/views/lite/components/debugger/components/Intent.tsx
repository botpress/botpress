import { Intent as BpIntent, Tag } from '@blueprintjs/core'
import React, { Fragment } from 'react'

import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

export const Intent = (props: { name: string; confidence?: number; elected?: boolean }) => {
  const { name, elected, confidence } = props
  const isQnA = isQnaItem(name)

  const displayName = isQnA ? formatQnaName(name) : name

  const textContent: string = confidence ? `${displayName}: ${formatConfidence(confidence)} %` : displayName
  const content = elected ? <strong>{textContent}</strong> : <span>{textContent}</span>

  return (
    <Fragment>
      <Tag intent={isQnA ? BpIntent.SUCCESS : BpIntent.PRIMARY} minimal>
        {isQnA ? 'Q&A' : 'NLU'}
      </Tag>
      &nbsp;
      <a onClick={navigateToIntentDefinition(name, isQnA)}>{content}</a>
    </Fragment>
  )
}

export const isQnaItem = (name: string) => {
  return name.startsWith(QNA_IDENTIFIER)
}

function formatQnaName(name: string): string {
  name = name.replace(QNA_IDENTIFIER, '')
  return name.substr(name.indexOf('_') + 1)
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
