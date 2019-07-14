import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import { makeApi } from '../api'

import { UtterancesEditor } from './intentSlate'
import IntentHint from './IntentHint'

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

  const handleUtterancesChange = (newUtterances: string[]) => {
    _.merge(intent, { utterances: { [props.contentLang]: newUtterances } })
    setIntent(intent)
    api.createIntent(intent) // TODO use update
  }

  return (
    intent && (
      <div>
        {/* TODO render context selector */}
        <IntentHint intent={intent} contentLang={props.contentLang} axios={props.bp.axios} />
        <UtterancesEditor utterances={utterances} onChange={handleUtterancesChange} slots={intent.slots} />
      </div>
    )
  )
}
