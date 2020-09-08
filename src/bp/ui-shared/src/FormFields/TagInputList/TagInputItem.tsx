import { Tag, TagInput } from '@blueprintjs/core'
import React, { FC, useEffect, useRef } from 'react'
import { useState } from 'react'
import { lang } from '~/translations'

import { Item } from '.'
import style from './style.scss'

interface Props {
  item: Item
  placeholder: string
  isFocused?: boolean
  onChange: (item: Item) => void
  removeItem: () => void
  addRow: () => void
  onBlur: () => void
}

const TagInputItem: FC<Props> = ({ item, isFocused, placeholder, onChange, removeItem, onBlur, addRow }) => {
  const inputRef = useRef<any>(null)
  const inputVal = useRef<any>('')
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    if (isFocused && inputRef.current?.inputElement) {
      inputRef.current.inputElement.focus()
    }
  }, [isFocused])

  return (
    <TagInput
      className={style.tagInput}
      leftIcon={
        !!item.name?.length ? (
          <Tag minimal className={style.tag}>
            {item.name}
          </Tag>
        ) : null
      }
      placeholder={lang(placeholder)}
      onChange={tags => onChange({ name: item.name, tags: tags as string[] })}
      inputProps={{ onBlur }}
      onAdd={e => {
        inputVal.current = ''
      }}
      onKeyDown={e => {
        if (inputVal.current === '' && e.key === 'Backspace') {
          e.preventDefault()
          if (item.tags.length) {
            item.tags.pop()
            setForceUpdate(!forceUpdate)
          } else if (item.name !== '') {
            item.name = ''
            setForceUpdate(!forceUpdate)
          } else {
            removeItem()
          }
        }

        if (e.key === ',') {
          e.preventDefault()
          e.stopPropagation()
          inputRef.current.addTags(inputVal.current)
        }

        if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
          e.preventDefault()
          e.stopPropagation()
          addRow()
        }
      }}
      onInputChange={e => {
        inputVal.current = e.currentTarget.value
      }}
      values={item.tags}
      tagProps={{ minimal: true }}
      ref={inputRef}
    />
  )
}

export default TagInputItem
