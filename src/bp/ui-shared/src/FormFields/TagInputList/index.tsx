import { Position, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { FC, Fragment } from 'react'
import { lang } from '~/translations'

import AddButton from '../../Contents/Components/Fields/AddButton'

import style from './style.scss'
import TagInputItem from './TagInputItem'

export interface Item {
  name: string
  tags: string[]
}

interface TagInputListProps {
  addBtnLabelTooltip?: string
  validation?: {
    regex?: RegExp
    list?: any[]
    validator?: (items: any[], newItem: any) => boolean
  }
  refValue?: Item[]
  addBtnLabel: string
  canAdd: boolean
  onChange: (items: Item[]) => void
  emptyPlaceholder: string
  placeholder: string
  items: Item[]
}

const TagInputList: FC<TagInputListProps> = ({
  addBtnLabelTooltip,
  validation,
  onChange,
  canAdd,
  emptyPlaceholder,
  placeholder,
  refValue,
  items,
  addBtnLabel
}) => {
  const getInitialItems = () => {
    let localItems = [...(items?.length ? items : [{ name: '', tags: [] }])]
    const diff = (refValue || []).length - items?.length

    if (diff > 0) {
      localItems = localItems.concat(Array(diff).fill(''))
    }

    return localItems
  }
  const initialItems = getInitialItems()
  const [localItems, setLocalItems] = useState(initialItems)
  const focusedElement = useRef(initialItems.length)

  useEffect(() => {
    setLocalItems(getInitialItems())
  }, [items])

  const updateLocalItem = (index: number, item: Item): void => {
    const newItems = [...localItems]
    const oldItems = [...localItems]
    if ((!item.name || item.name === '') && item.tags?.length === 1) {
      newItems[index] = { name: item.tags[0], tags: [] }
      onChange([...newItems])
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
    if (!canAdd) {
      return
    }

    focusedElement.current = localItems.length
    setLocalItems([...localItems, { name: '', tags: [] }])
  }

  const deleteItem = (index: number): void => {
    if (!canAdd) {
      return
    }

    const newItems = localItems.filter((item, i) => i !== index)
    setLocalItems(newItems)
    focusedElement.current = index - 1
    onChange([...newItems])
  }

  return (
    <Fragment>
      {localItems?.map((item, index) => {
        const missingTranslation =
          !canAdd &&
          [refValue?.[index]?.name || '', ...(refValue?.[index]?.tags || [])].filter(Boolean).length !==
            [item?.name || '', ...(item?.tags || [])].filter(Boolean).length

        return (
          <div key={index} className={cx(style.wrapper, { ['has-error']: missingTranslation })}>
            <TagInputItem
              item={item}
              canAdd={canAdd}
              key={item.name}
              isFocused={focusedElement.current === index}
              onChange={item => updateLocalItem(index, item)}
              placeholder={!item.name && !item.tags?.length ? emptyPlaceholder : placeholder}
              removeItem={() => deleteItem(index)}
              addRow={addItem}
              refValue={refValue?.[index]}
              onBlur={() => onChange([...localItems])}
            />
          </div>
        )
      })}
      {canAdd && (
        <Tooltip content={lang(addBtnLabelTooltip || 'quickAddAlternativeTags')} position={Position.BOTTOM}>
          <AddButton text={addBtnLabel} onClick={() => addItem()} />
        </Tooltip>
      )}
    </Fragment>
  )
}

export default TagInputList
