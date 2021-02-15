import { Button, ControlGroup, FormGroup } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { makeApi } from '../../../api'
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
  forceSave: boolean
  topicName: string
  params: IntentParams
  updateParams: (params: IntentParams) => void
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
  const [dirtyIntents, setDirtyIntents] = useState([])

  useEffect(() => {
    // Ensure the current topic is in the intent's contexts
    if (props.forceSave && dirtyIntents.length) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      api.syncIntentTopics()
    }
  }, [props.forceSave])

  const api = makeApi(props.bp)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadIntents()
  }, [])

  useEffect(() => {
    setDirtyIntents([])
  }, [isModalOpen])

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

  const onIntentChanged = async intent => {
    if (intent) {
      setDirtyIntents([...dirtyIntents, currentIntent])
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
        title={lang.tr('module.nlu.intents.createLabel')}
      />
      {currentIntent && <IntentEditor liteEditor intent={currentIntent} api={api} contentLang={props.contentLang} />}

      <div className={style.chooseContainer}>
        <ControlGroup>
          <FormGroup label={lang.tr('module.nlu.intents.chooseContainerLabel')}>
            <Button text={lang.tr('module.nlu.intents.createLabel')} onClick={toggleModal} />
            <IntentDropdown intents={intents} currentIntent={currentIntent} onChange={onIntentChanged} />
          </FormGroup>
        </ControlGroup>
      </div>
    </div>
  )
}
