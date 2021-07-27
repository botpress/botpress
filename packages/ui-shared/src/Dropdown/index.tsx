import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, Select } from '@blueprintjs/select'
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'

import confirmDialog from '../ConfirmDialog'
import { lang } from '../translations'

import style from './style.scss'
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
      icon={option.icon}
    />
  )
}

const filterOptions: ItemPredicate<Option> = (query, option) => {
  return `${option.label.toLowerCase()} ${option.value}`.indexOf(query.toLowerCase()) > -1
}

const Dropdown: FC<DropdownProps> = props => {
  const {
    hideActiveItemIcon,
    placeholder,
    filterPlaceholder,
    confirmChange,
    defaultItem,
    items,
    onChange,
    small,
    icon,
    rightIcon,
    children,
    spaced,
    className,
    filterable,
    filterList,
    customItemRenderer
  } = props
  const [activeItem, setActiveItem] = useState<Option | undefined>()
  const SimpleDropdown = Select.ofType<Option>()

  useEffect(() => {
    setActiveItem(typeof defaultItem === 'string' ? items.find(item => item.value === defaultItem) : defaultItem)
  }, [defaultItem])

  const updateSelectedOption = option => {
    onChange(option)
  }

  const btnText = activeItem ? activeItem.label : placeholder

  return (
    <SimpleDropdown
      filterable={filterable}
      className={className}
      inputProps={{ placeholder: filterPlaceholder || lang('filter') }}
      items={items}
      activeItem={activeItem}
      popoverProps={{ minimal: true, usePortal: true }}
      itemRenderer={customItemRenderer || itemRenderer}
      itemPredicate={filterOptions}
      itemListPredicate={filterList}
      onItemSelect={async option => {
        if (confirmChange) {
          confirmChange.callback?.(false)

          if (
            await confirmDialog(confirmChange.message, {
              acceptLabel: confirmChange.acceptLabel
            })
          ) {
            confirmChange.callback?.(true)
            updateSelectedOption(option)
          } else {
            confirmChange.callback?.(true)
          }
        } else {
          updateSelectedOption(option)
        }
      }}
    >
      {children || (
        <Button
          className={cx(style.btn, { [style.spaced]: spaced, [style.placeholder]: !activeItem })}
          text={small ? <small>{btnText}</small> : btnText}
          icon={!hideActiveItemIcon && (activeItem?.icon ?? icon)}
          rightIcon={rightIcon || 'double-caret-vertical'}
          small={small}
        />
      )}
    </SimpleDropdown>
  )
}

export default Dropdown
