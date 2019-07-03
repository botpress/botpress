import { Icon } from '@blueprintjs/core'
import { Item, ItemList, SearchBar, SectionAction, SidePanel, SidePanelSection } from 'botpress/ui'
import { CurrentItem } from 'full'
import React, { FC, useState } from 'react'

// TODO refine typings
interface Props {
  // intents: sdk.NLU.IntentDefinition[]
  intents: { name: string }[]
  currentItem: CurrentItem | undefined
  setCurrentItem: (item: CurrentItem) => void
}

// const NLUSidePanel: FC<Props> = props => {
const NLUSidePanel = props => {
  const [intentsFilter, setIntentsFilter] = useState('')

  const deleteIntent = async (intentName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the intent "${intentName}" ?`)
    if (confirmDelete) {
      if (props.currentItem.name === intentName) {
        props.setCurrentItem(undefined)
      }
      await props.api.deleteIntent(intentName).then(props.reloadIntents)
    }
  }

  const createIntent = async () => {
    const name = prompt('Enter the name of the new intent')

    if (!name || !name.length) {
      return
    }

    if (/[^a-z0-9-_.]/i.test(name)) {
      alert('Invalid name, only alphanumerical characters, underscores and hypens are accepted')
      return createIntent()
    }

    await props.api.createIntent(name)
    await props.reloadIntents()
    props.setCurrentItem({ name, type: 'intent' })
  }

  const intentActions: SectionAction[] = [
    {
      icon: <Icon icon="add" />,
      onClick: createIntent,
      tooltip: 'Create new intent'
    }
  ]

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

  // const [intentsFilter, setIntentsFilter] = useState('')
  // const entitiesActions: SectionAction[] = [
  //   {
  //     icon: <Icon icon="add" />,
  //     onClick: props.createEntity,
  //     tooltip: 'Create new entity'
  //   }
  // ]

  // const intentItems = props.intents
  //   .filter(intent => !filter || intent.name.includes(filter))
  //   .map(
  //     intent =>
  //       ({
  //         key: intent.name,
  //         label: intent.name,
  //         value: intent.name,
  //         selected: props.currentItem === intent.name,
  //         actions: [{ tooltip: 'Delete Intent', icon: 'delete', onClick: props.deleteIntent.bind(this, intent.name) }]
  //       } as Item)

  return (
    <SidePanel>
      <SidePanelSection label="Intents" actions={intentActions}>
        <SearchBar icon="filter" placeholder="filter intents" onChange={setIntentsFilter} showButton={false} />
        <ItemList
          items={intentItems}
          onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'intent', name })}
        />
      </SidePanelSection>
      {/* <SidePanelSection label="Entities" actions={entitiesActions}>
        {null}
      </SidePanelSection> */}
    </SidePanel>
  )
}

export default NLUSidePanel
