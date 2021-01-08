import { MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'
import { Collapsible, EmptyState, isOperationAllowed, lang, PermissionOperation } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useContext, useState } from 'react'

import { IHandoff } from '../../../../types'
import { HitlClient } from '../../../client'
import { Context } from '../Store'

interface Props {
  api: HitlClient
  handoff: IHandoff
}

const TagMultiSelect = MultiSelect.ofType<string>()

export const Tags: FC<Props> = ({ handoff, api }) => {
  const { tags, id } = handoff
  const { state, dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(true)

  const items = _.compact(_.castArray(tags))

  function currentAgentHasPermission(operation: PermissionOperation): boolean {
    return (
      state.currentAgent?.online &&
      isOperationAllowed({ user: state.currentAgent, resource: 'module.hitlnext', operation })
    )
  }

  async function handleSelect(tag: string) {
    if (isSelected(tag)) {
      return
    }

    const updated = [...items, tag]

    try {
      await api.updateHandoff(id, { tags: updated })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function handleRemove(_value: string, index: number) {
    const updated = _.filter(items, (_, i) => i !== index)

    try {
      await api.updateHandoff(id, { tags: updated })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  function renderTag(tag: string) {
    return tag
  }

  function renderItem(tag: string, { modifiers, handleClick }) {
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
      {_.isEmpty(state.config.tags) && <EmptyState text={lang.tr('module.hitlnext.tags.empty')} />}
      {!_.isEmpty(state.config.tags) && (
        <TagMultiSelect
          fill={true}
          placeholder={lang.tr('module.hitlnext.tags.placeholder')}
          noResults={<MenuItem disabled={true} text={lang.tr('module.hitlnext.tags.noResults')} />}
          items={state.config.tags}
          selectedItems={items}
          itemRenderer={renderItem}
          itemPredicate={filterTag}
          onItemSelect={handleSelect}
          tagRenderer={renderTag}
          tagInputProps={{ onRemove: handleRemove, disabled: !currentAgentHasPermission('write') }}
        />
      )}
    </Collapsible>
  )
}
