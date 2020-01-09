import { Button, Classes } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { NLU } from 'botpress/sdk'
import { Item, ItemList, SearchBar } from 'botpress/ui'
import { NluItem } from 'full'
import React, { FC, useState } from 'react'

import { EntityNameModal } from './EntityNameModal'

interface Props {
  api: NLUApi
  entities: NLU.EntityDefinition[]
  currentItem: NluItem
  setCurrentItem: (x: NluItem) => void
  reloadEntities: () => void
}

export const EntitySidePanelSection: FC<Props> = props => {
  const [entitiesFilter, setEntitiesFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [entityName, setEntityName] = useState()
  const [entityAction, setEntityAction] = useState<any>('create')

  const createEntity = () => {
    setEntityAction('create')
    setModalOpen(true)
  }

  const renameEntity = (entity: NLU.EntityDefinition) => {
    setEntityName(entity.name)
    setEntityAction('rename')
    setModalOpen(true)
  }

  const duplicateEntity = (entity: NLU.EntityDefinition) => {
    setEntityName(entity.name)
    setEntityAction('duplicate')
    setModalOpen(true)
  }

  const deleteEntity = (entity: NLU.EntityDefinition) => {
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
          contextMenu: [
            { label: 'Rename', icon: 'edit', onClick: () => renameEntity(entity) },
            { label: 'Duplicate', icon: 'duplicate', onClick: () => duplicateEntity(entity) },
            { label: 'Delete', icon: 'delete', onClick: () => deleteEntity(entity) }
          ]
        } as Item)
    )

  const onEntityModified = entity => {
    props.setCurrentItem({ type: 'entity', name: entity.name })
    props.reloadEntities()
  }

  return (
    <div>
      <Button
        className={Classes.MINIMAL}
        icon="new-object"
        text="New entity"
        onClick={createEntity}
      />
      <SearchBar
        id="entities-filter"
        icon="filter"
        placeholder="filter entities"
        onChange={setEntitiesFilter}
        showButton={false}
      />
      <ItemList
        items={entityItems}
        onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'entity', name })}
      />
      <EntityNameModal
        action={entityAction}
        originalName={entityName}
        entityIDs={props.entities.map(e => e.id)}
        api={props.api}
        onEntityModified={onEntityModified}
        isOpen={modalOpen}
        closeModal={() => setModalOpen(false)}
      />
    </div>
  )
}
