import { Button, ControlGroup, FormGroup } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import { makeApi } from '../api'
import { IntentEditor } from '../lite/intentEditor/IntentEditor'

import style from './style.scss'
import IntentDropdown from './IntentDropdown'
import NameModal from './NameModal'

interface IntentParams {
  intentName: string
}

interface Props {
  bp: any
  contentLang: string
  params: IntentParams
  updateParams: (params: IntentParams) => void
}

export const LiteEditor: FC<Props> = props => {
  const [intents, setIntents] = useState<NLU.IntentDefinition[]>([])
  const [currentIntent, setCurrentIntent] = useState(props.params.intentName)
  const [isModalOpen, setModalOpen] = useState(false)

  const api = makeApi(props.bp)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    loadIntents()
  }, [])

  const loadIntents = async () => {
    setIntents(await api.fetchIntents())
  }

  const createIntent = async (sanitizedName: string) => {
    const intentDef = {
      name: sanitizedName,
      utterances: { [props.contentLang]: [name] }
    }

    props.updateParams({ intentName: sanitizedName })
    await api.createIntent(intentDef)
    await loadIntents()

    setCurrentIntent(sanitizedName)
  }

  const onIntentChanged = intent => {
    if (intent) {
      setCurrentIntent(intent.name)
      props.updateParams({ intentName: intent.name })
    }
  }

  const toggleModal = () => setModalOpen(!isModalOpen)

  return (
    <div>
      <NameModal isOpen={isModalOpen} toggle={toggleModal} intents={intents} onCreate={createIntent} />
      {currentIntent && (
        <IntentEditor
          liteEditor={true}
          intent={currentIntent}
          api={api}
          contentLang={props.contentLang}
          showSlotPanel={false}
          axios={props.bp.axios} // to be removed for api, requires a lot of refactoring
        />
      )}

      <div className={style.chooseContainer}>
        <ControlGroup>
          <FormGroup label="Choose a different intent for the condition">
            <Button text="Create new intent" onClick={toggleModal} />
            <IntentDropdown intents={intents} currentIntent={currentIntent} onChange={onIntentChanged} />
          </FormGroup>
        </ControlGroup>
      </div>
    </div>
  )
}
