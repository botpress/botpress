import { Button, Classes, Icon } from '@blueprintjs/core'
import { NLUAPI } from 'api'
import { NLU } from 'botpress/sdk'
import { Item, ItemList, SearchBar, SectionAction, SidePanelSection } from 'botpress/ui'
import { CurrentItem } from 'full'
import React, { FC, useState } from 'react'

import CreateEntityModal from './CreateEntityModal'

interface Props {
  api: NLUAPI
  entities: NLU.EntityDefinition[]
  currentItem: CurrentItem
  setCurrentItem: (x: CurrentItem) => void
  reloadEntities: () => void
}

export const EntitySidePanelSection: FC<Props> = props => {
  const [entitiesFilter, setEntitiesFilter] = useState('')
  const [showEntityModal, setShowEntityModal] = useState(false)

  const deleteEntity = entity => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the entity "${entity.name}" ?`)
    if (confirmDelete) {
      if (props.currentItem && props.currentItem.name === entity.name) {
        props.setCurrentItem(undefined)
      }

      props.api.deleteEntity(entity.id).then(props.reloadEntities)
    }
  }

  const entityItems = props.entities
    .filter(entity => !entitiesFilter || entity.name.includes(entitiesFilter))
    .map(
      entity =>
        ({
          key: entity.name,
          label: entity.name,
          value: entity.name,
          selected: props.currentItem && props.currentItem.name === entity.name,
          actions: [
            {
              tooltip: 'Delete Entity',
              icon: 'delete',
              onClick: () => {
                deleteEntity(entity)
              }
            }
          ]
        } as Item)
    )

  const entityCreated = entity => {
    props.setCurrentItem({ type: 'entity', name: entity.name })
    props.reloadEntities()
  }

  return (
    <div>
      <Button
        className={Classes.MINIMAL}
        icon="new-object"
        text="New entity"
        onClick={() => setShowEntityModal(!showEntityModal)}
      />
      <SearchBar icon="filter" placeholder="filter entities" onChange={setEntitiesFilter} showButton={false} />
      <ItemList
        items={entityItems}
        onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'entity', name })}
      />
      <CreateEntityModal
        api={props.api}
        onEntityCreated={entityCreated}
        visible={showEntityModal}
        hide={() => setShowEntityModal(false)}
      />
    </div>
  )
}
