import { Collapsible, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useState } from 'react'
import { MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'

import { IHandoff } from '../../../../types'
import { ApiType } from '../../Api'
import { Context } from '../Store'

interface Props {
  api: ApiType
  handoff: IHandoff
}

const StringMultiSelect = MultiSelect.ofType<string>()

export const Tags: FC<Props> = ({ handoff, api }) => {
  const { tags, id } = handoff
  const { dispatch, state } = useContext(Context)

  const [expanded, setExpanded] = useState(true)
  const [items, setItems] = useState(_.compact(_.castArray(tags)))
  const [availableItems, setAvailableItems] = useState(state.config.tags)

  function handleSelect(value, index) {
    console.log('handleSelect', value)
    const updated = [...items, value]
    setItems(updated) // Optimistic update
    api.updateHandoff(id, { tags: updated }).catch(error => setItems(updated.slice(0, -1)))
  }

  function handleRemove(value, index) {
    console.log('handleRemove', value)
    const updated = _.filter(items, (v, i) => i != index)
    setItems(updated) // Optimistic update
    api.updateHandoff(id, { tags: updated }).catch(error => setItems(updated.slice(0, -1)))
  }

  function renderTag(tag: string) {
    return tag
  }

  function renderItem(tag, { modifiers, handleClick }) {
    if (!modifiers.matchesPredicate) {
      return null
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={isSelected(tag)}
        icon={isSelected(tag) ? 'tick' : 'blank'}
        onClick={handleClick}
        key={tag}
        text={tag}
      />
    )
  }

  function filterTag(query: string, item: string) {
    return item.toLowerCase().indexOf(query.toLowerCase()) >= 0
  }

  function isSelected(tag: string) {
    return items.includes(tag)
  }

  return (
    <Collapsible
      opened={expanded}
      toggleExpand={() => setExpanded(!expanded)}
      name={lang.tr('module.hitlnext.tags.heading')}
      ownProps={{ transitionDuration: 10 }}
    >
      {!_.isEmpty(state.config.tags) && (
        <StringMultiSelect
          fill={true}
          placeholder={lang.tr('module.hitlnext.tags.placeholder')}
          noResults={<MenuItem disabled={true} text="No results." />}
          items={availableItems}
          selectedItems={items}
          itemRenderer={renderItem}
          itemPredicate={filterTag}
          onItemSelect={handleSelect}
          tagRenderer={renderTag}
          tagInputProps={{ onRemove: handleRemove }}
        />
      )}
    </Collapsible>
  )
}
