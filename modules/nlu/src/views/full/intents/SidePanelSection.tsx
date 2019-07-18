import { Button, Classes } from '@blueprintjs/core'
import { NLUAPI } from 'api'
import { NLU } from 'botpress/sdk'
import { Item, ItemList, SearchBar, SectionAction, SidePanelSection } from 'botpress/ui'
import { CurrentItem } from 'full'
import React, { FC, useState } from 'react'

interface Props {
  api: NLUAPI
  intents: NLU.IntentDefinition[]
  currentItem: CurrentItem
  contentLang: string
  setCurrentItem: (x: CurrentItem) => void
  reloadIntents: () => void
}

export const IntentSidePanelSection: FC<Props> = props => {
  const [intentsFilter, setIntentsFilter] = useState('')

  const deleteIntent = (intentName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the intent "${intentName}" ?`)
    if (confirmDelete) {
      if (props.currentItem && props.currentItem.name === intentName) {
        props.setCurrentItem(undefined)
      }

      props.api.deleteIntent(intentName).then(props.reloadIntents)
    }
  }

  const createIntent = async () => {
    const name = prompt('Enter the name of the new intent')

    if (!name || !name.length) {
      return
    }

    const sanitizedName = name
      .toLowerCase()
      .replace(/\s|\t|\n/g, '-')
      .replace(/[^a-z0-9-_.]/g, '')

    const intentDef = {
      name: sanitizedName,
      utterances: { [props.contentLang]: [name] }
    }

    await props.api.createIntent(intentDef)
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
          actions: [
            {
              tooltip: 'Delete Intent',
              icon: 'delete',
              onClick: () => {
                deleteIntent(intent.name)
              }
            }
          ]
        } as Item)
    )

  return (
    <div>
      <Button className={Classes.MINIMAL} icon="new-object" text="New intent" onClick={createIntent} />
      <SearchBar icon="filter" placeholder="filter intents" onChange={setIntentsFilter} showButton={false} />
      <ItemList
        items={intentItems}
        onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'intent', name })}
      />
    </div>
  )
}
