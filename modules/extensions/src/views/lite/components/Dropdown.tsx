import { Button, Classes, MenuItem, PopoverPosition } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import React, { FC, useEffect, useState } from 'react'

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
}

// TODOS :
// handle multi
// proper i18n

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
  const shouldDisplay = props.isLastGroup && props.isLastOfGroup

  const Keyboard = props.keyboard
  const [items, setItems] = useState<Option[]>([])
  const [selectedItem, setSelected] = useState<Option | undefined>()
  const [isOpened, setIsOpen] = useState(false)

  useEffect(() => {
    const itms = props.options?.map((o: Option) => ({ label: o.label, value: o.value || o.label })) ?? [] // kept logic
    setItems(itms)
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

  const placeholder = 'Select from these options'

  const selectProps = {
    items,
    placeholder,
    className: style.formSelect,
    filterable: items.length > 6,
    popoverProps: {
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
  // item = 20, button = 40, padding = 25
  const bpHeight = isOpened && items.length * 20 + 40 + 50

  const keyboard = (
    <div className={'bpw-keyboard-quick_reply'} style={{ height: isOpened && bpHeight }}>
      <OptionSelect {...selectProps}>
        <Button text={<small>{selectedItem?.label ?? placeholder}</small>} rightIcon={'chevron-down'} small />
      </OptionSelect>
    </div>
  )

  return (
    <Keyboard.Prepend keyboard={keyboard} visible={shouldDisplay}>
      {props.children || props.message}
    </Keyboard.Prepend>
  )
}
