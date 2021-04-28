import { Icon } from '@blueprintjs/core'
import sdk from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'

const MIN_NB_UTTERANCES = 3
const GOOD_NB_UTTERANCES = 10

import style from './style.scss'

interface Props {
  intent: sdk.NLU.IntentDefinition
  contentLang: string
  liteEditor: boolean
}

// At some point, recommendations will be computed in the backend and this component will simply fetch and display intents recommendations
const IntentHint: FC<Props> = props => {
  const utterances = props.intent.utterances[props.contentLang] || []
  const slotsLength = (props.intent.slots || []).length

  /*
    The ideal number of utterances should not be computed for the whole intent but rather by slots.
    Meaning, we should recommend a number of utterances for each slot, what we are doing right now is only
    valid if there're no slots. Also, we should do a density based clustering per slots and for the whole intent
    to see if the utterances all belong to the same class or if the are considerable different ways of saying
    the same thing. Then, we could also not only recommend number of utterances per intent & slots but by cluster also.
  */
  const idealNumberOfUtt = Math.max(Math.pow(slotsLength * 2, 2), GOOD_NB_UTTERANCES)
  let hint: JSX.Element

  if (!utterances.length) {
    hint = <span>{lang.tr('nlu.intents.hintIgnored')}</span>
  }

  if (utterances.length && utterances.length < MIN_NB_UTTERANCES) {
    const remaining = MIN_NB_UTTERANCES - utterances.length
    hint = (
      <span>
        {lang.tr('nlu.intents.hintExactMatch', {
          nb: remaining,
          exactOnly: <strong>{lang.tr('nlu.intents.exactOnly')}</strong>
        })}
      </span>
    )
  }

  if (utterances.length >= MIN_NB_UTTERANCES && utterances.length < idealNumberOfUtt) {
    const remaining = idealNumberOfUtt - utterances.length
    hint = <span>{lang.tr('nlu.intents.hintResilient', { nb: remaining })}</span>
  }
  return hint ? (
    <p className={cx(style.hint, { [style.lightEditorHint]: props.liteEditor })}>
      {!utterances.length && <Icon icon="warning-sign" />}
      {!!utterances.length && <Icon icon="symbol-diamond" />}
      {hint}
    </p>
  ) : null
}

export default IntentHint
