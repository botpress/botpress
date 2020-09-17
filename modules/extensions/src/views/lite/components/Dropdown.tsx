import { Button, Classes, MenuItem, PopoverPosition } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import sdk from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import lang from '../../lang'

import style from './style.scss'

interface Option {
  label: string
  value: string
}

interface Props {
  options: Option[] // in fact a mobX observerable
  isLastGroup: boolean
  isLastOfGroup: boolean
  message: string
  keyboard: any
  onSendData?: Function
  buttonText?: string
  displayInKeyboard?: boolean // do we want to support this ?
  allowCreation: boolean // do we want to support this ?
  allowMultiple: boolean // do we want to support this ?
  width: number // do we want to support this ?
  collectFeedback: boolean // do we want to support this ?
  position: sdk.IO.SuggestionPosition
}

// TODOS :
// handle multi

const itemRenderer: ItemRenderer<Option> = (item, { modifiers, handleClick }) => (
  <MenuItem
    className={Classes.SMALL}
    key={item.label}
    text={item.label}
    active={modifiers.active}
    onClick={handleClick}
  />
)

const OptionSelect = Select.ofType<Option>()

export const Dropdown: FC<Props> = props => {
  const Keyboard = props.keyboard
  const [items, setItems] = useState<Option[]>([])
  const [selectedItem, setSelected] = useState<Option | undefined>()
  const [isOpened, setIsOpen] = useState(false)

  useEffect(() => {
    setItems(props.options?.map((o: Option) => ({ label: o.label, value: o.value || o.label })) ?? []) // kept logic
  }, [])

  const onItemSelect = (item: Option) => {
    setSelected(item)
    const payload = { type: 'quick_reply', text: item.label, payload: item.value || item.label }
    props.onSendData?.(payload)
  }

  const handleQuery: ItemPredicate<Option> = (query, option) => {
    const compact = `${option.label}${option.value}`.toLowerCase()
    return compact.indexOf(query.toLowerCase()) !== -1
  }

  const placeholder = props.buttonText ? props.buttonText : lang.tr('module.extensions.components.dropdown.placeholder')
  const filterable = items.length > 6

  const selectProps = {
    items,
    placeholder,
    filterable,
    className: style.formSelect,
    popoverProps: {
      popoverClassName: filterable ? 'filterable' : '',
      minimal: true,
      usePortal: false,
      position: PopoverPosition.BOTTOM,
      onOpening: () => setIsOpen(true),
      onClosing: () => setIsOpen(false)
    },
    itemPredicate: handleQuery,
    onItemSelect,
    itemRenderer
  }

  // hack to control the height of parent for my lack of css skills
  // item = 26, list menu padding = 5, dropdown button = 40, search button = 30, outside padding = 12
  const bgHeight = isOpened && items.length * 26 + 40 + 2 * 5 + 2 * 12 + (filterable && 30)

  const keyboard = (
    <OptionSelect {...selectProps}>
      <Button text={<small>{selectedItem?.label ?? placeholder}</small>} rightIcon={'chevron-down'} small />
    </OptionSelect>
  )

  if (props.position === 'conversation') {
    return keyboard
  }

  const shouldDisplay = (props.isLastGroup && props.isLastOfGroup) || props.position === 'static'
  return (
    <Keyboard.Prepend
      keyboard={
        <div className={'bpw-keyboard-quick_reply'} style={{ height: isOpened && bgHeight }}>
          {keyboard}
        </div>
      }
      visible={shouldDisplay}
    >
      {props.children || props.message}
    </Keyboard.Prepend>
  )
}
