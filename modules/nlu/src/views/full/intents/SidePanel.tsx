import { Icon, InputGroup } from '@blueprintjs/core'
import sdk from 'botpress/sdk'
import { Item, ItemList, SectionAction, SidePanel, SidePanelSection } from 'botpress/ui'
import React, { FC, useState } from 'react'

interface Props {
  intents: sdk.NLU.IntentDefinition[]
  currentIntent: string
  setCurrentIntent: (name: string) => void
  deleteIntent: (name: string) => void
  createIntent: () => void
}

const NLUSidePanel: FC<Props> = props => {
  const [filter, setFilter] = useState('')
  const actions: SectionAction[] = [
    {
      icon: <Icon icon="add" />,
      onClick: props.createIntent,
      tooltip: 'Create new intent'
    }
  ]

  const items = props.intents
    .filter(intent => !filter || intent.name.includes(filter))
    .map(
      intent =>
        ({
          key: intent.name,
          label: intent.name,
          value: intent.name,
          selected: props.currentIntent == intent.name,
          actions: [{ tooltip: 'remove', icon: 'delete', onClick: props.deleteIntent.bind(this, intent.name) }]
        } as Item)
    )

  return (
    <SidePanel>
      <SidePanelSection label="Intents" actions={actions}>
        <InputGroup onChange={e => setFilter(e.target.value)} leftIcon="filter" placeholder="filter intents" />
        <ItemList items={items} onElementClicked={({ value: intentName }) => props.setCurrentIntent(intentName)} />
      </SidePanelSection>
    </SidePanel>
  )
}

export default NLUSidePanel
