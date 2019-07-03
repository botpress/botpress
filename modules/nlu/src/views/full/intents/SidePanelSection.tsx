import { Icon } from '@blueprintjs/core'
import { Item, ItemList, SearchBar, SectionAction, SidePanelSection } from 'botpress/ui'
import React, { FC, useState } from 'react'

// // TODO refine typings
// interface Props {
//   // intents: sdk.NLU.IntentDefinition[]
//   intents: { name: string }[]
//   currentItem: CurrentItem | undefined
//   setCurrentItem: (item: CurrentItem) => void
// }

// const createIntent = async (api, reloadIntents, setCurrentIntent) => {
//   return () => {
//     const name = prompt('Enter the name of the new intent')

//     if (!name || !name.length) {
//       return
//     }

//     if (/[^a-z0-9-_.]/i.test(name)) {
//       alert('Invalid name, only alphanumerical characters, underscores and hypens are accepted')
//       return createIntent(api, reloadIntents, setCurrentIntent)
//     }

//     api.createIntent(name).then(reloadIntents).then(setCurrentIntent(name))
//   }
// }

// TODO add props
// const IntentSidePanelSection: FC<Props> = props => {
export const IntentSidePanelSection = props => {
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

  return (
    <SidePanelSection label="Intents" actions={intentActions}>
      <SearchBar icon="filter" placeholder="filter intents" onChange={setIntentsFilter} showButton={false} />
      <ItemList
        items={intentItems}
        onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'intent', name })}
      />
    </SidePanelSection>
  )
}
