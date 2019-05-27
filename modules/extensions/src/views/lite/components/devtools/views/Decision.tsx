import { H5, Pre } from '@blueprintjs/core'
import React from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

export const Decision = props => {
  const finalDecision = props.decision
  if (!finalDecision) {
    return null
  }
  const { source, sourceDetails, decision, confidence } = finalDecision

  const QNA_PREFIX = '__qna__'
  const link =
    source === 'qna'
      ? `/modules/qna#search:${sourceDetails.replace(QNA_PREFIX, '')}`
      : `/modules/nlu/Intents#search:${sourceDetails}`

  return (
    <div className={style.block}>
      <H5>Decision</H5>{' '}
      <Pre>
        <span>{sourceDetails}</span> ({decision && decision.reason} - {formatConfidence(confidence)}
        %)
      </Pre>
    </div>
  )
}
