import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, Select } from '@blueprintjs/select'
import { FC, useEffect, useState } from 'react'
import React from 'react'

import { DropdownProps, Option } from './typings'

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
  const { defaultItem, items, onChange, small, icon, rightIcon, spaced, className, filterable } = props
  const [activeItem, setActiveItem] = useState<Option | undefined>()
  const SimpleDropdown = Select.ofType<Option>()

  useEffect(() => {
    setActiveItem(typeof defaultItem === 'string' ? items.find(item => item.value === defaultItem) : defaultItem)
  }, [defaultItem])

  return (
    <SimpleDropdown
      filterable={filterable}
      className={className}
      items={items}
      activeItem={activeItem}
      popoverProps={{ minimal: true }}
      itemRenderer={itemRenderer}
      itemPredicate={filterOptions}
      onItemSelect={option => {
        onChange(option)
        setActiveItem(option)
      }}
    >
      <Button
        text={small ? <small>{activeItem && activeItem.label}</small> : activeItem && activeItem.label}
        icon={icon}
        rightIcon={rightIcon || 'double-caret-vertical'}
        small={small}
        style={{ margin: spaced ? '0 5px 0 5px' : 0 }}
      />
    </SimpleDropdown>
  )
}

export default Dropdown
