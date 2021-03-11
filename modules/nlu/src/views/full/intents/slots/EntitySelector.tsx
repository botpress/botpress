import { MenuItem, Position } from '@blueprintjs/core'
import { ItemRenderer, MultiSelect } from '@blueprintjs/select'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { NLUApi } from '../../../../api'
import style from '../style.scss'
import { entityNameInput } from './style.scss'

const SYSTEM_ENTITIES = [
  'amountOfMoney',
  'distance',
  'duration',
  'email',
  'number',
  'ordinal',
  'phoneNumber',
  'quantity',
  'temperature',
  'time',
  'url',
  'volume'
]

interface EntityOption {
  type: string
  name: string
}
interface Props {
  entities: string[]
  api: NLUApi
  onChange: (entities: string[]) => void
}

export const EntitySelector: FC<Props> = props => {
  const [availableEntities, setAvbEntities] = useState([])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    props.api.fetchEntities().then(setAvbEntities)
  }, [])

  const removeItem = (_, idx: number) => {
    props.onChange([...props.entities.slice(0, idx), ...props.entities.slice(idx + 1)])
  }

  const addEntity = (ent: EntityOption) => {
    props.onChange([...props.entities, ent.name])
  }

  const selectEntity = (ent: EntityOption) => {
    const idx = props.entities.indexOf(ent.name)
    if (idx !== -1) {
      removeItem(ent, idx)
    } else {
      addEntity(ent)
    }
  }

  const getEntityName = (entity: EntityOption): string => {
    let entityName = `${entity.type}.${entity.name}`
    const translatedName = lang.tr('module.nlu.slots.names.' + entity.name)

    if (SYSTEM_ENTITIES.includes(entity.name) && translatedName !== entity.name) {
      entityName += ` (${translatedName})`
    }

    return entityName
  }

  const entityItemRenderer: ItemRenderer<EntityOption> = (entity: EntityOption, { handleClick, modifiers }) => (
    <MenuItem
      text={getEntityName(entity)}
      key={`${entity.name}${entity.type}`}
      onClick={handleClick}
      active={modifiers.active}
      icon={!!props.entities.find(e => e === entity.name) ? 'tick' : 'blank'}
    />
  )

  return (
    <MultiSelect
      resetOnSelect
      placeholder={lang.tr('module.nlu.entities.selectPlaceholder')}
      items={availableEntities}
      itemRenderer={entityItemRenderer}
      itemPredicate={(q, ent: EntityOption) => !q || ent.type.includes(q) || ent.name.includes(q)}
      tagRenderer={(ent: EntityOption) => ent}
      onItemSelect={selectEntity}
      tagInputProps={{ tagProps: { minimal: true }, onRemove: removeItem, leftIcon: 'caret-down' }}
      popoverProps={{
        usePortal: false,
        minimal: true,
        position: Position.BOTTOM_LEFT,
        boundary: 'window',
        targetClassName: style.entitySelect,
        popoverClassName: style.entitySelectPopover
      }}
      selectedItems={props.entities}
    />
  )
}
