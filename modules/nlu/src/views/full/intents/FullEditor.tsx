import { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { NLUApi } from '../../../api'

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
  showSlotPanel?: boolean
  axios: AxiosInstance
  liteEditor?: boolean
}

export const IntentEditor: FC<Props> = props => {
  const [intent, setIntent] = useState<NLU.IntentDefinition>()

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    props.api.fetchIntent(props.intent).then(setIntent)
  }, [props.intent])

  if (!intent) {
    // TODO display a fetching state instead
    return null
  }

  const saveIntent = (newIntent: NLU.IntentDefinition) => {
    setIntent(newIntent)
    // tslint:disable-next-line: no-floating-promises
    props.api.createIntent(newIntent)
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

  const utterances = (intent && intent.utterances[props.contentLang]) || []

  return (
    <div className={cx(style.intentEditor, { [style.liteIntentEditor]: props.liteEditor })}>
      <div>
        <div className={style.header}>
          {!props.liteEditor && (
            <ContextSelector
              contexts={intent.contexts}
              saveContexts={contexts => saveIntent({ ...intent, contexts })}
              api={props.api}
            />
          )}
          <IntentHint
            intent={intent}
            liteEditor={props.liteEditor}
            contentLang={props.contentLang}
            axios={props.axios}
          />
        </div>
        <UtterancesEditor
          intentName={intent.name}
          utterances={utterances}
          onChange={handleUtterancesChange}
          slots={intent.slots}
        />
      </div>
      {props.showSlotPanel && (
        <Slots slots={intent.slots} api={props.api} axios={props.axios} onSlotsChanged={handleSlotsChange} />
      )}
    </div>
  )
}
