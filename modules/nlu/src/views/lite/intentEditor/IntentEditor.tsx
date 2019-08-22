import { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { IntentValidation } from '../../../backend/typings'
import { NLUApi } from '../../api'

import Slots from './slots/Slots'
import style from './style.scss'
import { removeSlotFromUtterances, renameSlotInUtterances } from './utterances-state-utils'
import { ContextSelector } from './ContextSelector'
import IntentHint from './IntentHint'
import { UtterancesEditor } from './UtterancesEditor'

interface Props {
  intent: string
  api: NLUApi
  contentLang: string
  showSlotPanel: boolean
  axios: AxiosInstance
}

export const IntentEditor: FC<Props> = props => {
  const [intent, setIntent] = useState<NLU.IntentDefinition>()
  const [validation, setValidation] = useState<IntentValidation>()

  const fetchValidation = async () => {
    const { axios, contentLang, intent } = props
    const { data } = await axios.get(`mod/nlu/intents/${intent}/validation?lang=${contentLang}`)
    // const { data } = await axios.post(`mod/nlu/intents/validation?lang=${contentLang}`, { intent })
    return data
  }

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    props.api.fetchIntent(props.intent).then(setIntent)
    // tslint:disable-next-line: no-floating-promises
    fetchValidation().then(setValidation)
  }, [props.intent])

  if (!intent) {
    // TODO display a fetching state instead
    return null
  }

  const throttledApiCall = _.throttle(async newIntent => {
    await props.api.createIntent(newIntent)
    setValidation(await fetchValidation())
  }, 2500)

  const saveIntent = async (newIntent: NLU.IntentDefinition) => {
    setIntent(newIntent)
    await throttledApiCall(newIntent)
  }

  const handleUtterancesChange = async (newUtterances: string[]) => {
    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances } }
    await saveIntent(newIntent)
  }

  const handleSlotsChange = async (slots: NLU.SlotDefinition[], { operation, name, oldName }) => {
    let newUtterances = [...intent.utterances[props.contentLang]]
    if (operation === 'deleted') {
      newUtterances = removeSlotFromUtterances(newUtterances, name)
    } else if (operation === 'modified') {
      newUtterances = renameSlotInUtterances(newUtterances, oldName, name)
    }

    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances }, slots }
    await saveIntent(newIntent)
  }

  const utterances = (intent && intent.utterances[props.contentLang]) || []

  return (
    <div className={style.intentEditor}>
      <div>
        <div className={style.header}>
          <ContextSelector
            contexts={intent.contexts}
            saveContexts={contexts => saveIntent({ ...intent, contexts })}
            api={props.api}
          />
          <IntentHint intent={intent} contentLang={props.contentLang} axios={props.axios} />
        </div>
        <UtterancesEditor
          intentName={intent.name}
          utterances={utterances}
          onChange={handleUtterancesChange}
          slots={intent.slots}
          validation={validation}
        />
      </div>
      {props.showSlotPanel && <Slots slots={intent.slots} axios={props.axios} onSlotsChanged={handleSlotsChange} />}
    </div>
  )
}
