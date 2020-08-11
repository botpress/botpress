import { Position, Tooltip } from '@blueprintjs/core'
import React, { useEffect, useRef, useState } from 'react'
import { lang } from '~/translations'
import { controlKey } from '~/utils/keyboardShortcuts'
import ShortcutLabel from '~/ShortcutLabel'

import AddButton from '../../Contents/Components/Fields/AddButton'

import { SingleTag } from './SingleTag'

export interface Item {
  name: string
  synonyms: string[]
}

const TagInputList = ({ onChange, placeholder, items, addBtnLabel }) => {
  const [localItems, setLocalItems] = useState(items || [])
  const focusedElement = useRef(items.length)

  useEffect(() => {
    setLocalItems(items ?? [])
  }, [items])

  const updateLocalItem = (index: number, item): void => {
    if (item.name === '' && item.synonyms.length === 1) {
      localItems[index] = { name: item.synonyms[0], synonyms: [] }
    } else {
      localItems[index] = item
    }

    setLocalItems([...localItems])
  }

  const addItem = (): void => {
    focusedElement.current = localItems.length
    setLocalItems([...localItems, { name: '', synonyms: [] }])
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

    const isLast = localItems?.[index]?.synonyms?.length === 0
    if (e.key === 'Backspace' && shouldDelete && isLast) {
      e.preventDefault()
      deleteItem(index)
    }
  }

  return (
    <div>
      {localItems?.map((item, index) => (
        <SingleTag
          item={item}
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
