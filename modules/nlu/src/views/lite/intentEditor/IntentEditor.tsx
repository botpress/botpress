import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import { makeApi } from '../../api'

import Slots from './slots/Slots'
import style from './style.scss'
import { removeSlotFromUtterances, renameSlotInUtterances } from './utterances-state-utils'
import IntentHint from './IntentHint'
import { UtterancesEditor } from './UtterancesEditor'

export const IntentEditor = props => {
  const api = makeApi(props.bp)
  const [intent, setIntent] = useState<NLU.IntentDefinition>()
  // const [contexts, setContexts] = useState([])

  useEffect(() => {
    // api.fetchContexts().then(setContexts)
    api.fetchIntent(props.intentName).then(setIntent)
  }, [props.intentName])

  const utterances = (intent && intent.utterances[props.contentLang]) || []
  if (!intent) {
    // TODO display a fetching state instead
    return null
  }

  const saveIntent = (newIntent: NLU.IntentDefinition) => {
    setIntent(newIntent)
    api.createIntent(newIntent)
  }

  const handleUtterancesChange = (newUtterances: string[]) => {
    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances } }
    saveIntent(newIntent)
  }

  const handleSlotsChange = (slots: NLU.SlotDefinition[], { operation, name, oldName }) => {
    let newUtterances = [...intent.utterances[props.contentLang]]
    if (operation === 'deleted') {
      newUtterances = removeSlotFromUtterances(newUtterances, name)
    } else if (operation === 'modified') {
      newUtterances = renameSlotInUtterances(newUtterances, oldName, name)
    }

    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances }, slots }
    saveIntent(newIntent)
  }

  return (
    intent && (
      <div className={style.intentEditor}>
        <div>
          <IntentHint intent={intent} contentLang={props.contentLang} axios={props.bp.axios} />
          <UtterancesEditor utterances={utterances} onChange={handleUtterancesChange} slots={intent.slots} />
        </div>
        {props.showSlotPanel && (
          <Slots slots={intent.slots} axios={props.bp.axios} onSlotsChanged={handleSlotsChange} />
        )}
      </div>
    )
  )
}
