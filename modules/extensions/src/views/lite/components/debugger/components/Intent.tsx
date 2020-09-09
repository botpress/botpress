import { Intent as BpIntent, Tag } from '@blueprintjs/core'
import React, { Fragment } from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

export const Intent = (props: { topicName: string; name: string; confidence?: number; elected?: boolean }) => {
  const { topicName, name, confidence, elected } = props
  const isQnA = isQnaItem(name)

  const displayName = isQnA ? formatQnaName(name) : name

  return (
    <Fragment>
      <a onClick={navigateToIntentDefinition(topicName, name, isQnA)}>{displayName}</a>
      {confidence && <span className={style.confidence}>{formatConfidence(confidence)}%</span>}
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

const navigateToIntentDefinition = (topicName: string, intent: string, isQna: boolean) => () => {
  let url
  if (isQna) {
    url = `/oneflow/${topicName}/qna?id=${intent}`
  } else {
    url = intent === 'none' ? '/modules/nlu' : `/modules/nlu?type=intent&id=${intent}` // TODO point to studio in intent (trigger)
  }
  window.parent.postMessage({ action: 'navigate-url', payload: url }, '*')
}
