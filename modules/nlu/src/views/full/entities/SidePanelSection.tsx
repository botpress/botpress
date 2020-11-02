import { Button, Classes } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { confirmDialog, lang } from 'botpress/shared'
import { Item, ItemList, SearchBar } from 'botpress/ui'
import React, { FC, useState } from 'react'

import { NluItem } from '..'
import { NLUApi } from '../../../api'

import { EntityNameModal } from './EntityNameModal'

interface Props {
  api: NLUApi
  entities: NLU.EntityDefinition[]
  currentItem: NluItem
  setCurrentItem: (x: NluItem) => void
  reloadEntities: () => void
  reloadIntents: () => void
}

export const EntitySidePanelSection: FC<Props> = props => {
  const [entitiesFilter, setEntitiesFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [entity, setEntity] = useState<NLU.EntityDefinition>()
  const [entityAction, setEntityAction] = useState<any>('create')

  const createEntity = () => {
    setEntityAction('create')
    setModalOpen(true)
  }

  const renameEntity = (entity: NLU.EntityDefinition) => {
    setEntity(entity)
    setEntityAction('rename')
    setModalOpen(true)
  }

  const duplicateEntity = (entity: NLU.EntityDefinition) => {
    setEntity(entity)
    setEntityAction('duplicate')
    setModalOpen(true)
  }

  const deleteEntity = async (entity: NLU.EntityDefinition) => {
    if (
      await confirmDialog(lang.tr('module.nlu.entities.deleteMessage', { entityName: entity.name }), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      if (props.currentItem && props.currentItem.name === entity.name) {
        props.setCurrentItem(undefined)
      }

      await props.api.deleteEntity(entity.name)
      await props.reloadEntities()
      await props.reloadIntents()
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
            { label: lang.tr('rename'), icon: 'edit', onClick: () => renameEntity(entity) },
            {
              label: lang.tr('duplicate'),
              icon: 'duplicate',
              onClick: () => duplicateEntity(entity)
            },
            { label: lang.tr('delete'), icon: 'delete', onClick: () => deleteEntity(entity) }
          ]
        } as Item)
    )

  const onEntityModified = (entity: NLU.EntityDefinition) => {
    props.setCurrentItem({ type: 'entity', name: entity.name })
    props.reloadEntities()
  }

  return (
    <div>
      <Button
        className={Classes.MINIMAL}
        icon="new-object"
        text={lang.tr('module.nlu.entities.new')}
        onClick={createEntity}
      />
      <SearchBar
        id="entities-filter"
        icon="filter"
        placeholder={lang.tr('module.nlu.entities.filterPlaceholder')}
        onChange={setEntitiesFilter}
        showButton={false}
      />
      <ItemList
        items={entityItems}
        onElementClicked={({ value: name }) => props.setCurrentItem({ type: 'entity', name })}
      />
      <EntityNameModal
        action={entityAction}
        originalEntity={entity}
        entityIDs={props.entities.map(e => e.id)}
        api={props.api}
        onEntityModified={onEntityModified}
        isOpen={modalOpen}
        closeModal={() => setModalOpen(false)}
      />
    </div>
  )
}
