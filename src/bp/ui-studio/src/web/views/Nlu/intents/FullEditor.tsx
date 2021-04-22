import { NLU } from 'botpress/sdk'
import { utils } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useRef, useState } from 'react'

import { NluClient } from '../client'

import { ContextSelector } from './ContextSelector'
import IntentHint from './IntentHint'
import Slots from './slots/Slots'
import style from './style.scss'
import { removeSlotFromUtterances, renameSlotInUtterances } from './utterances-state-utils'
import { UtterancesEditor } from './UtterancesEditor'

interface Props {
  intent: string
  api: NluClient
  contentLang: string
  showSlotPanel?: boolean
  liteEditor?: boolean
}

export const IntentEditor: FC<Props> = props => {
  const [intent, setIntent] = useState<NLU.IntentDefinition>()

  const debouncedApiSaveIntent = useRef(
    _.debounce((newIntent: NLU.IntentDefinition) => props.api.createIntent(newIntent), 2500)
  )

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    props.api.fetchIntent(props.intent).then(intent => {
      setIntent(intent)
      utils.inspect(intent)
    })

    return () => debouncedApiSaveIntent.current.flush()
  }, [props.intent])

  if (!intent) {
    // TODO display a fetching state instead
    return null
  }

  const saveIntent = (newIntent: NLU.IntentDefinition) => {
    setIntent(newIntent)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    props.api.createIntent(newIntent)
  }

  const handleUtterancesChange = async (newUtterances: string[]) => {
    const newIntent = { ...intent, utterances: { ...intent.utterances, [props.contentLang]: newUtterances } }
    setIntent(newIntent)
    await debouncedApiSaveIntent.current(newIntent)
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
          <IntentHint intent={intent} liteEditor={props.liteEditor} contentLang={props.contentLang} />
        </div>
        <UtterancesEditor
          intentName={intent.name}
          utterances={utterances}
          onChange={handleUtterancesChange}
          slots={intent.slots}
        />
      </div>
      {props.showSlotPanel && <Slots slots={intent.slots} api={props.api} onSlotsChanged={handleSlotsChange} />}
    </div>
  )
}
