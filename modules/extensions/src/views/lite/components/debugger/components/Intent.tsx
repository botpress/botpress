import { Intent as BpIntent, Tag } from '@blueprintjs/core'
import React, { Fragment } from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

export const Intent = (props: { name: string; confidence?: number; elected?: boolean }) => {
  const { name, elected, confidence } = props
  const isQnA = isQnaItem(name)

  const displayName = isQnA ? formatQnaName(name) : name

  return (
    <Fragment>
      <a onClick={navigateToIntentDefinition(name, isQnA)}>{displayName}</a>
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
