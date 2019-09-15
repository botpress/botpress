import { Icon } from '@blueprintjs/core'
import sdk from 'botpress/sdk'
import React, { SFC } from 'react'

import { NluMlRecommendations } from '../../../backend/typings'

import style from './style.scss'

interface Props {
  intent: sdk.NLU.IntentDefinition
  contentLang: string
  mlRecommendations: NluMlRecommendations
}

const IntentHint: SFC<Props> = props => {
  const utterances = props.intent.utterances[props.contentLang] || []
  const slotsLength = (props.intent.slots || []).length

  const goodMLUtterances = props.mlRecommendations.goodUtterancesForML
  const minMLUtterances = props.mlRecommendations.minUtterancesForML

  if (!minMLUtterances || !goodMLUtterances) {
    return null
  }

  /*
    The ideal number of utterances should not be computed for the whole intent but rather by slots.
    Meaning, we should recommend a number of utterances for each slot, what we are doing right now is only
    valid if the're no slots. Also, we should do a density based clustering per slots and for the whole intent
    to see if the utterances all belong to the same class or if the are considerable different ways of saying
    the samething. Then, we could also not only recommend number of utterances per intent & slots but by cluster also.
  */
  const idealNumberOfUtt = Math.max(Math.pow(slotsLength * 2, 2), goodMLUtterances)
  let hint: JSX.Element

  if (!utterances.length) {
    hint = <span>This intent will be ignored, start adding utterances to make it trainable.</span>
  }

  if (utterances.length && utterances.length < minMLUtterances) {
    hint = (
      <span>
        This intent will use <strong>exact match only</strong>. To enable machine learning, add at least{' '}
        <strong>{minMLUtterances - utterances.length} more utterances</strong>
      </span>
    )
  }

  if (utterances.length >= minMLUtterances && utterances.length < idealNumberOfUtt) {
    hint = (
      <span>
        Add <strong>{idealNumberOfUtt - utterances.length} more utterances</strong> to make NLU more resilient.
      </span>
    )
  }
  return hint ? (
    <p className={style.hint}>
      {!utterances.length && <Icon icon="warning-sign" />}
      {!!utterances.length && <Icon icon="symbol-diamond" />}
      {hint}
    </p>
  ) : null
}

export default IntentHint
