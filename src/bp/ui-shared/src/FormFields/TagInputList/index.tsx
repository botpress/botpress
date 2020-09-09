import { Position, Tooltip } from '@blueprintjs/core'
import React, { useEffect, useRef, useState } from 'react'
import { Fragment } from 'react'
import { lang } from '~/translations'

import AddButton from '../../Contents/Components/Fields/AddButton'

import style from './style.scss'
import TagInputItem from './TagInputItem'

export interface Item {
  name: string
  tags: string[]
}

const TagInputList = ({ validation, onChange, emptyPlaceholder, placeholder, items, addBtnLabel }) => {
  const [localItems, setLocalItems] = useState(items?.length ? items : [{ name: '', tags: [] }])
  const focusedElement = useRef(items?.length || 0)

  useEffect(() => {
    setLocalItems(items?.length ? items : [{ name: '', tags: [] }])
  }, [items])

  const updateLocalItem = (index: number, item: Item): void => {
    const newItems = [...localItems]
    const oldItems = [...localItems]
    if (item.name === '' && item.tags?.length === 1) {
      newItems[index] = { name: item.tags[0], tags: [] }
    } else {
      newItems[index] = item
    }
    if (
      validation?.validator &&
      [oldItems[index].name, ...oldItems[index].tags]?.length < [item.name, ...item.tags]?.length
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

  return (
    <Fragment>
      {localItems?.map((item, index) => (
        <div className={style.wrapper}>
          <TagInputItem
            item={item}
            key={item.name}
            isFocused={focusedElement.current === index}
            onChange={item => updateLocalItem(index, item)}
            placeholder={!item.name && !item.tags?.length ? emptyPlaceholder : placeholder}
            removeItem={() => deleteItem(index)}
            addRow={addItem}
            onBlur={() => onChange([...localItems])}
          />
        </div>
      ))}
      <Tooltip content={lang('quickAddAlternative')} position={Position.BOTTOM}>
        <AddButton text={addBtnLabel} onClick={() => addItem()} />
      </Tooltip>
    </Fragment>
  )
}

export default TagInputList
