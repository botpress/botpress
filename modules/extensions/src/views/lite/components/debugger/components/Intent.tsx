import { parseFlowName } from 'common/flow'
import React, { Fragment } from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

export const Intent = (props: { topicName: string; name: string; confidence?: number; elected?: boolean }) => {
  const { topicName, name, confidence } = props
  const isQnA = isQnaItem(name)

  const displayName = isQnA ? formatQnaName(name) : name

  return (
    <Fragment>
      <a onClick={navigateToIntentDefinition(topicName, name, isQnA)}>{displayName}</a>
      {confidence && <span className={style.confidence}>{formatConfidence(confidence)}</span>}
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
    const nodeIndex = intent.indexOf('/trigger-')
    const path = intent.substring(0, nodeIndex)
    const nodeId = intent.substring(nodeIndex + 1).split('/')

    url = `/oneflow/${path}?highlightedNode=${nodeId?.[0]}`
  }
  window.parent.postMessage({ action: 'navigate-url', payload: url }, '*')
}
