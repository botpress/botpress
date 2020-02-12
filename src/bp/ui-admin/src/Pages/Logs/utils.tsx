import { Classes, InputGroup, MenuItem } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'
import { Filter } from 'react-table'

export const dropdownRenderer = (option, { modifiers, handleClick }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }
  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.label || option}
      onClick={handleClick}
      text={option.label || option}
    />
  )
}

export const filterText = ({ filter, onChange }): any => (
  <InputGroup value={filter ? filter.value : ''} onChange={event => onChange(event.target.value)} />
)

export const lowercaseFilter = (filter: Filter, row: any, column: any): boolean => {
  if (column.id === 'botId') {
    return row[filter.id] === filter.value
  }

  return (row[filter.id] || '').toLowerCase().includes(filter.value.toLowerCase())
}
