import { NLU } from 'botpress/sdk'
import { confirmDialog, lang, toast } from 'botpress/shared'

import _ from 'lodash'
import React, { FC, useState } from 'react'
import { ItemList, SearchBar } from '~/components/Shared/Interface'
import { Item } from '~/components/Shared/Interface/typings'

import { NluItem } from '..'
import { NluClient } from '../client'

import NameModal from './NameModal'

interface Props {
  api: NluClient
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
      await confirmDialog(lang.tr('nlu.intents.deleteConfirmMessage', { intentName }), {
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
        toast.failure(lang.tr('nlu.intents.actionErrorMessage', { action: 'delete' }))
      }
    }
  }

  const onSubmit = async (sanitizedName: string, rawName: string) => {
    if (modalAction === 'rename') {
      await renameIntent(intentName, sanitizedName)
    } else if (modalAction === 'duplicate') {
      await duplicateIntent(intentName, sanitizedName)
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
      toast.failure(lang.tr('nlu.intents.actionErrorMessage', { action: 'rename' }))
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
      toast.failure(lang.tr('nlu.intents.actionErrorMessage', { action: 'duplicate' }))
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
      {props.intents.length > 1 && (
        <SearchBar
          id="intents-filter"
          icon="filter"
          placeholder={lang.tr('nlu.intents.filterPlaceholder')}
          onChange={setIntentsFilter}
          showButton={false}
        />
      )}
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
