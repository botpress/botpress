import { Button, Classes } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { confirmDialog, lang } from 'botpress/shared'
import { Item, ItemList, SearchBar } from 'botpress/ui'
import { toastFailure } from 'botpress/utils'
import _ from 'lodash'
import React, { FC, useState } from 'react'

import { NluItem } from '..'
import { NLUApi } from '../../api'

import NameModal from './NameModal'

interface Props {
  api: NLUApi
  intents: NLU.IntentDefinition[]
  currentItem: NluItem
  contentLang: string
  setCurrentItem: (x: NluItem) => void
  reloadIntents: () => Promise<void>
}

type NameModalAction = 'rename' | 'create' | 'duplicate'

export const IntentSidePanelSection: FC<Props> = props => {
  const [modalOpen, setModalOpen] = useState(false)
  const [intentName, setIntentName] = useState('')
  const [modalAction, setModalAction] = useState<NameModalAction>('create')
  const [intentsFilter, setIntentsFilter] = useState('')

  const showIntentNameModal = (intentName: string, action: NameModalAction) => {
    setIntentName(intentName)
    setModalAction(action)
    setModalOpen(true)
  }

  const deleteIntent = async (intentName: string) => {
    if (
      await confirmDialog(lang.tr('module.nlu.intents.deleteConfirmMessage', { intentName }), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      if (props.currentItem && props.currentItem.name === intentName) {
        props.setCurrentItem(undefined)
      }

      try {
        await props.api.deleteIntent(intentName)
        await props.reloadIntents()
      } catch (err) {
        toastFailure(lang.tr('module.nlu.intents.actionErrorMessage', { action: 'delete' }))
      }
    }
  }

  const onSubmit = async (sanitizedName: string, rawName: string) => {
    if (modalAction === 'create') {
      await createIntent(sanitizedName, rawName)
    } else if (modalAction === 'rename') {
      await renameIntent(intentName, sanitizedName)
    } else if (modalAction === 'duplicate') {
      await duplicateIntent(intentName, sanitizedName)
    }
  }

  const createIntent = async (sanitizedName: string, rawName: string) => {
    const intentDef = {
      name: sanitizedName,
      utterances: { [props.contentLang]: [rawName] } // note usage of raw name as first utterance
    }

    try {
      await props.api.createIntent(intentDef)
      await props.reloadIntents()
      props.setCurrentItem({ name: sanitizedName, type: 'intent' })
    } catch (err) {
      toastFailure(lang.tr('module.nlu.intents.actionErrorMessage', { action: 'create' }))
    }
  }

  const renameIntent = async (targetIntent: string, sanitizedName: string) => {
    const intent = props.intents.find(i => i.name === targetIntent)
    if (!intent) {
      return
    }

    try {
      await props.api.updateIntent(targetIntent, { ...intent, name: sanitizedName })
      await props.reloadIntents()
      props.setCurrentItem({ name: sanitizedName, type: 'intent' })
    } catch (err) {
      toastFailure(lang.tr('module.nlu.intents.actionErrorMessage', { action: 'rename' }))
    }
  }

  const duplicateIntent = async (targetIntent: string, sanitizedName: string) => {
    const intent = props.intents.find(i => i.name === targetIntent)
    if (!intent) {
      return
    }

    try {
      await props.api.createIntent({ ...intent, name: sanitizedName })
      await props.reloadIntents()
      props.setCurrentItem({ name: sanitizedName, type: 'intent' })
    } catch (err) {
      toastFailure(lang.tr('module.nlu.intents.actionErrorMessage', { action: 'duplicate' }))
    }
  }

  const intentItems = props.intents
    .filter(intent => !intentsFilter || intent.name.includes(intentsFilter))
    .map(
      intent =>
        ({
          key: intent.name,
          label: intent.name,
          value: intent.name,
          selected: props.currentItem && props.currentItem.name === intent.name,
          contextMenu: [
            {
              label: lang.tr('rename'),
              icon: 'edit',
              onClick: () => showIntentNameModal(intent.name, 'rename')
            },
            {
              label: lang.tr('duplicate'),
              icon: 'duplicate',
              onClick: () => showIntentNameModal(intent.name, 'duplicate')
            },
            {
              label: lang.tr('delete'),
              icon: 'delete',
              onClick: () => deleteIntent(intent.name)
            }
          ]
        } as Item)
    )

  return (
    <div>
      <Button
        id="btn-add-intent"
        className={Classes.MINIMAL}
        icon="new-object"
        text={lang.tr('module.nlu.intents.new')}
        onClick={() => showIntentNameModal('', 'create')}
      />
      <SearchBar
        id="intents-filter"
        icon="filter"
        placeholder={lang.tr('module.nlu.intents.filterPlaceholder')}
        onChange={setIntentsFilter}
        showButton={false}
      />
      <ItemList
        items={intentItems}
        onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'intent', name })}
      />

      <NameModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(!modalOpen)}
        onSubmit={onSubmit}
        title={`${modalAction} intent`}
        originalName={intentName}
        intents={props.intents}
      />
    </div>
  )
}
