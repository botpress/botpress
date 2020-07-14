import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, Select } from '@blueprintjs/select'
import cx from 'classnames'
import { FC, useEffect, useState } from 'react'
import React from 'react'

import style from './style.scss'

export interface Option {
  label: string
  value: string
  description?: string
}

export interface DropdownProps {
  filterable?: boolean
  items: Option[]
  onClick: (option: Option) => void
}

const itemRenderer = (option, { modifiers, handleClick }) => {
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

const filterOptions: ItemPredicate<Option> = (query, option) => {
  return `${option.label.toLowerCase()} ${option.value}`.indexOf(query.toLowerCase()) > -1
}

const Dropdown: FC<DropdownProps> = props => {
  const { items, onClick, filterable } = props
  const SuperInputDropdown = Select.ofType<Option>()

  return (
    <SuperInputDropdown
      filterable={true}
      className={cx(style.dropdown)}
      items={items}
      popoverProps={{ minimal: true, usePortal: false, isOpen: true }}
      itemRenderer={itemRenderer}
      itemPredicate={filterOptions}
      onItemSelect={async option => {
        onClick(option)
      }}
    ></SuperInputDropdown>
  )
}

export default Dropdown
