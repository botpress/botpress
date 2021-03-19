import { Button, Classes, IconName, MenuItem } from '@blueprintjs/core'
import { Suggest } from '@blueprintjs/select'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'

export interface Option {
  name: string
  version: string
  icon?: IconName | JSX.Element
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
      key={option.name || option}
      onClick={handleClick}
      text={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{option.name}</strong> <br></br>
            {(option.description || '').slice(0, 150)}
          </div>
          <div>{option.version}</div>
        </div>
      }
      icon={option.icon}
    />
  )
}

const Dropdown: FC<any> = props => {
  const { placeholder, onQueryChange, items, onChange, className } = props
  const [activeItem, setActiveItem] = useState<Option | undefined>()
  const SimpleDropdown = Suggest.ofType<Option>()

  const btnText = activeItem ? activeItem.name : placeholder

  return (
    <SimpleDropdown
      className={className}
      inputValueRenderer={item => item.name}
      inputProps={{ placeholder: lang.tr('module.libraries.libraryName') }}
      items={items}
      activeItem={activeItem}
      popoverProps={{ minimal: true, usePortal: false }}
      itemRenderer={itemRenderer}
      onQueryChange={onQueryChange}
      onItemSelect={option => onChange(option)}
    >
      <Button text={btnText} rightIcon={'double-caret-vertical'} />
    </SimpleDropdown>
  )
}

export default Dropdown
