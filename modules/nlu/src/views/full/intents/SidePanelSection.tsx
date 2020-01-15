import { Button, Classes } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { NLU } from 'botpress/sdk'
import { Item, ItemList, SearchBar } from 'botpress/ui'
import { NluItem } from 'full'
import _ from 'lodash'
import React, { FC, useState } from 'react'

import NameModal from './NameModal'

interface Props {
  api: NLUApi
  intents: NLU.IntentDefinition[]
  currentItem: NluItem
  contentLang: string
  setCurrentItem: (x: NluItem) => void
  reloadIntents: () => void
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

  const deleteIntent = (intentName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the intent "${intentName}" ?`)
    if (confirmDelete) {
      if (props.currentItem && props.currentItem.name === intentName) {
        props.setCurrentItem(undefined)
      }

      props.api.deleteIntent(intentName).then(props.reloadIntents)
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

    await props.api.createIntent(intentDef)
    await props.reloadIntents()
    props.setCurrentItem({ name: sanitizedName, type: 'intent' })
  }

  const renameIntent = async (targetIntent: string, sanitizedName: string) => {
    const intent = await props.api.fetchIntent(targetIntent)
    // we might want to use the intent in the array instead of fetching it
    intent.name = sanitizedName
    await props.api.updateIntent(targetIntent, intent)
    await props.reloadIntents()
    props.setCurrentItem({ name: sanitizedName, type: 'intent' })
  }

  const duplicateIntent = async (targetIntent: string, sanitizedName: string) => {
    // we might want to use the intent in the array instead of fetching it
    const intent = await props.api.fetchIntent(targetIntent)
    const clone = _.cloneDeep(intent)
    clone.name = sanitizedName
    await props.api.createIntent(clone)
    await props.reloadIntents()
    props.setCurrentItem({ name: sanitizedName, type: 'intent' })
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
              label: 'Rename',
              icon: 'edit',
              onClick: () => showIntentNameModal(intent.name, 'rename')
            },
            {
              label: 'Duplicate',
              icon: 'duplicate',
              onClick: () => showIntentNameModal(intent.name, 'duplicate')
            },
            { label: 'Delete', icon: 'delete', onClick: () => deleteIntent(intent.name) }
          ]
        } as Item)
    )

  return (
    <div>
      <Button
        id="btn-add-intent"
        className={Classes.MINIMAL}
        icon="new-object"
        text="New intent"
        onClick={() => showIntentNameModal('', 'create')}
      />
      <SearchBar
        id="intents-filter"
        icon="filter"
        placeholder="filter intents"
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
