import { Position, Tooltip } from '@blueprintjs/core'
import React, { useEffect, useRef, useState } from 'react'
import { lang } from '~/translations'
import { controlKey } from '~/utils/keyboardShortcuts'
import ShortcutLabel from '~/ShortcutLabel'

import AddButton from '../../Contents/Components/Fields/AddButton'

import TagInputItem from './TagInputItem'

export interface Item {
  name: string
  tags: string[]
}

const TagInputList = ({ validation, onChange, placeholder, items, addBtnLabel }) => {
  const [localItems, setLocalItems] = useState(items || [])
  const focusedElement = useRef(items.length)

  useEffect(() => {
    setLocalItems(items ?? [])
  }, [items])

  const updateLocalItem = (index: number, item: Item): void => {
    const newItems = [...localItems]
    const oldItems = [...localItems]
    if (item.name === '' && item.tags.length === 1) {
      newItems[index] = { name: item.tags[0], tags: [] }
    } else {
      newItems[index] = item
    }
    if (
      validation?.validator &&
      [oldItems[index].name, ...oldItems[index].tags].length < [item.name, ...item.tags].length
    ) {
      if (validation.validator(localItems, item)) {
        setLocalItems(newItems)
      }
    } else {
      setLocalItems(newItems)
    }
  }

  const addItem = (): void => {
    focusedElement.current = localItems.length
    setLocalItems([...localItems, { name: '', tags: [] }])
  }

  const deleteItem = (index: number): void => {
    const newItems = localItems.filter((item, i) => i !== index)
    setLocalItems(newItems)
    focusedElement.current = index - 1
    onChange([...newItems])
  }

  const onKeyDown = (index: number, e, shouldDelete: boolean): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      addItem()
    }

    const isLast = localItems?.[index]?.tags?.length === 0
    if (e.key === 'Backspace' && shouldDelete && isLast) {
      e.preventDefault()
      deleteItem(index)
    }
  }

  return (
    <div>
      {localItems?.map((item, index) => (
        <TagInputItem
          item={item}
          key={item.name}
          isFocused={focusedElement.current === index}
          onChange={item => updateLocalItem(index, item)}
          placeholder={placeholder}
          onKeyDown={(e, shouldDelete) => onKeyDown(index, e, shouldDelete)}
          onBlur={() => onChange([...localItems])}
        />
      ))}
      <Tooltip
        content={lang('quickAddAlternative', {
          shortcut: <ShortcutLabel light keys={[controlKey, 'enter']} />
        })}
        position={Position.BOTTOM}
      >
        <AddButton text={addBtnLabel} onClick={() => addItem()} />
      </Tooltip>
    </div>
  )
}

export default TagInputList
