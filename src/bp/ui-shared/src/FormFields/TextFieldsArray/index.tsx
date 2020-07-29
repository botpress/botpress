import { Position, Tooltip } from '@blueprintjs/core'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import { lang } from '../../translations'
import { controlKey } from '../../utils/keyboardShortcuts'
import AddButton from '../../Contents/Components/Fields/AddButton'
import ShortcutLabel from '../../ShortcutLabel'
import Textarea from '../../Textarea'

import style from './style.scss'
import { TextFieldsArrayProps } from './typings'

const TextFieldsArray: FC<TextFieldsArrayProps> = props => {
  const { addBtnLabel, label, onChange, items, getPlaceholder } = props
  const [localItems, setLocalItems] = useState(items || [])
  const focusedElement = useRef(items.length)

  useEffect(() => {
    setLocalItems(items || [])
  }, [items.length])

  const updateLocalItem = (index: number, value: string): void => {
    localItems[index] = value
    setLocalItems([...localItems])
  }

  const addItem = (value = ''): void => {
    focusedElement.current = localItems.length
    setLocalItems([...localItems, ''])
  }

  const onKeyDown = (e, index: number): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      addItem()
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }

    const shouldDelete = !localItems[index].length && localItems.length > 1

    if (e.key === 'Backspace' && shouldDelete) {
      e.preventDefault()

      deleteItem(index)
    }
  }

  const deleteItem = (index: number): void => {
    const newItems = localItems.filter((item, i) => i !== index)
    setLocalItems(newItems)
    focusedElement.current = index - 1
    onChange([...newItems])
  }

  return (
    <div className={style.items}>
      <h2>{label}</h2>
      {props.moreInfo}
      {localItems?.map((item, index) => (
        <div key={index} className={style.textareaWrapper}>
          <Textarea
            isFocused={focusedElement.current === index}
            className={style.customTextarea}
            placeholder={getPlaceholder?.(index)}
            onChange={value => updateLocalItem(index, value)}
            onBlur={() => onChange([...localItems])}
            onKeyDown={e => onKeyDown(e, index)}
            value={item}
          />
        </div>
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

export default TextFieldsArray
