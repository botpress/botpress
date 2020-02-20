import { Button, ControlGroup, FormGroup } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import { makeApi } from '../../api'
import style from '../style.scss'

import { IntentEditor } from './FullEditor'
import IntentDropdown from './IntentDropdown'
import NameModal from './NameModal'

interface IntentParams {
  intentName: string
}

interface Props {
  bp: any
  contentLang: string
  topicName: string
  params: IntentParams
  updateParams: (params: IntentParams) => void
  forceSave?: boolean
}

export const sanitizeName = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s|\t|\n/g, '-')
    .replace(/[^a-z0-9-_.]/g, '')

export const LiteEditor: FC<Props> = props => {
  const [intents, setIntents] = useState<NLU.IntentDefinition[]>([])
  const [currentIntent, setCurrentIntent] = useState(props.params.intentName)
  const [isModalOpen, setModalOpen] = useState(false)

  const api = makeApi(props.bp)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    loadIntents()
  }, [])

  useEffect(() => {
    // Ensure the current topic is in the intent's contexts
    if (props.forceSave) {
      // tslint:disable-next-line: no-floating-promises
      api.fetchIntent(currentIntent).then(async intent => {
        if (!intent.contexts.includes(props.topicName)) {
          intent.contexts.push(props.topicName)
          await api.updateIntent(currentIntent, intent)
        }
      })
    }
  }, [props.forceSave])

  const loadIntents = async () => {
    setIntents(await api.fetchIntents())
  }

  const createIntent = async (sanitizedName: string, rawName: string) => {
    const intentDef = {
      name: sanitizedName,
      contexts: [props.topicName || 'global'],
      utterances: { [props.contentLang]: [rawName] }
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
      <NameModal
        isOpen={isModalOpen}
        toggle={toggleModal}
        intents={intents}
        onSubmit={createIntent}
        title="Create Intent"
      />
      {currentIntent && (
        <IntentEditor
          liteEditor={true}
          intent={currentIntent}
          api={api}
          contentLang={props.contentLang}
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
