import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import React, { FC, useState } from 'react'

export interface Option {
  label: string
  value: string
}

interface Props {
  items: Option[]
  defaultItem?: Option
  onChange: (option: Option) => void
  icon?: any
  rightIcon?: any
  small?: boolean
  spaced?: boolean
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

const Dropdown: FC<Props> = props => {
  const [activeItem, setActiveItem] = useState<Option | undefined>(props.defaultItem)
  const SimpleDropdown = Select.ofType<Option>()

  return (
    <SimpleDropdown
      items={props.items}
      activeItem={activeItem}
      popoverProps={{ minimal: true }}
      itemRenderer={itemRenderer}
      onItemSelect={option => {
        props.onChange(option)
        setActiveItem(option)
      }}
    >
      <Button
        text={props.small ? <small>{activeItem && activeItem.label}</small> : activeItem && activeItem.label}
        icon={props.icon}
        rightIcon={props.rightIcon || 'double-caret-vertical'}
        small={props.small}
        style={{ margin: props.spaced ? '0 5px 0 5px' : 0 }}
      />
    </SimpleDropdown>
  )
}

export default Dropdown
