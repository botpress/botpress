import { Button, Classes } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { NLU } from 'botpress/sdk'
import { Item, ItemList, SearchBar, SectionAction, SidePanelSection } from 'botpress/ui'
import { NluItem } from 'full'
import _ from 'lodash'
import React, { FC, useState } from 'react'

import IntentNameModal from './IntentNameModal'

interface Props {
  api: NLUApi
  intents: NLU.IntentDefinition[]
  currentItem: NluItem
  contentLang: string
  setCurrentItem: (x: NluItem) => void
  reloadIntents: () => void
}

export const IntentSidePanelSection: FC<Props> = props => {
  const [modalOpen, setModalOpen] = useState(false)
  const [intentName, setIntentName] = useState()
  const [intentAction, setIntentAction] = useState<any>('create')
  const [intentsFilter, setIntentsFilter] = useState('')

  const createIntent = () => {
    setIntentAction('create')
    setModalOpen(true)
  }

  const renameIntent = (intentName: string) => {
    setIntentName(intentName)
    setIntentAction('rename')
    setModalOpen(true)
  }

  const duplicateIntent = (intentName: string) => {
    setIntentName(intentName)
    setIntentAction('duplicate')
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

  const onCreateIntent = async (name: string) => {
    const intentDef = {
      name: name,
      utterances: { [props.contentLang]: [name] }
    }

    await props.api.createIntent(intentDef)
    await props.reloadIntents()
    props.setCurrentItem({ name: name, type: 'intent' })
  }

  const onRenameIntent = async (targetIntent: string, name: string) => {
    const intent = await props.api.fetchIntent(targetIntent)
    intent.name = name
    await props.api.updateIntent(targetIntent, intent)
    await props.reloadIntents()
    props.setCurrentItem({ name: name, type: 'intent' })
  }

  const onDuplicateIntent = async (targetIntent: string, name: string) => {
    const intent = await props.api.fetchIntent(targetIntent)
    const clone = _.cloneDeep(intent)
    clone.name = name
    await props.api.createIntent(clone)
    await props.reloadIntents()
    props.setCurrentItem({ name: name, type: 'intent' })
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
            { label: 'Rename', icon: 'edit', onClick: () => renameIntent(intent.name) },
            { label: 'Duplicate', icon: 'duplicate', onClick: () => duplicateIntent(intent.name) },
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
        onClick={createIntent}
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

      <IntentNameModal
        action={intentAction}
        originalName={intentName}
        intentNames={props.intents.map(i => i.name)}
        isOpen={modalOpen}
        toggle={() => setModalOpen(!modalOpen)}
        onCreateIntent={onCreateIntent}
        onRenameIntent={onRenameIntent}
        onDuplicateIntent={onDuplicateIntent}
      />
    </div>
  )
}
