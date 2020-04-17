import { Icon } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'
import _ from 'lodash'
import { lang } from 'botpress/shared'

const QnaHint = props => {
  const utterances = props.questions.filter(q => q.length) || []

  const goodMLUtterances = props.mlRecommendations && props.mlRecommendations.goodUtterancesForML
  const minMLUtterances = props.mlRecommendations && props.mlRecommendations.minUtterancesForML

  const hint = createHint(utterances, goodMLUtterances, minMLUtterances)
  return hint ? (
    <p className={style.hint}>
      {!utterances.length && <Icon icon="warning-sign" />}
      {!!utterances.length && <Icon icon="symbol-diamond" />}
      {hint}
    </p>
  ) : null
}

const createHint = (utterances, goodMLUtterances, minMLUtterances) => {
  if (!minMLUtterances || !goodMLUtterances) {
    return null
  }

  const idealNumberOfUtt = goodMLUtterances

  if (!utterances.length) {
    return <span>{lang.tr('module.qna.hint.willBeIgnored')}</span>
  }

  if (utterances.length && utterances.length < minMLUtterances) {
    const remaining = minMLUtterances - utterances.length
    return (
      <span>
        {lang.tr('module.qna.hint.willBeExact', {
          exactMatchOnly: <strong>{lang.tr('module.qna.hint.exactMatchOnly')}</strong>,
          remaining
        })}
      </span>
    )
  }

  if (utterances.length >= minMLUtterances && utterances.length < idealNumberOfUtt) {
    const remaining = idealNumberOfUtt - utterances.length
    return (
      <span>
        {lang.tr('module.qna.hint.addMoreQuestions', {
          moreQuestions: <strong>{lang.tr('module.qna.hint.moreQuestions', { remaining })}</strong>
        })}
      </span>
    )
  }
}

export default QnaHint
