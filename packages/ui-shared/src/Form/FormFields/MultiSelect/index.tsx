import { Classes, MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'
import React, { FC } from 'react'

import sharedStyle from '../../../../../ui-shared-lite/style.scss'
import { lang } from '../../../translations'

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

interface Props {
  onChange: (value: string[][]) => void
  value: string[][]
  options: string[][]
  placeholder: string
}

const MultiSelectComponent: FC<Props> = ({ onChange, value, options, placeholder }) => {
  const handleItemSelect = item => {
    if (!isItemSelected(item)) {
      selectItem(item)
    } else {
      deselectItem(getSelectedItemIndex(item))
    }
  }

  const isItemSelected = item => {
    return getSelectedItemIndex(item) !== -1
  }

  const getSelectedItemIndex = item => {
    return value.indexOf(item)
  }

  const selectItem = item => {
    onChange([...value, item])
  }

  const deselectItem = (index: number) => {
    onChange([...value.filter((v, i) => i !== index)])
  }

  return (
    <MultiSelect
      className={sharedStyle.formSelect}
      popoverProps={{ minimal: true, usePortal: false }}
      selectedItems={value}
      items={options}
      placeholder={lang(placeholder)}
      tagRenderer={(item: any) => item.label}
      itemRenderer={itemRenderer}
      tagInputProps={{
        onRemove: (e, index) => deselectItem(index)
      }}
      onItemSelect={handleItemSelect}
    />
  )
}
export default MultiSelectComponent
