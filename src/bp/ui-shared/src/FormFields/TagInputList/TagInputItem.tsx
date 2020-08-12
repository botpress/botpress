import { Tag, TagInput } from '@blueprintjs/core'
import React, { FC, useEffect, useRef } from 'react'
import { lang } from '~/translations'

import { Item } from '.'
import style from './style.scss'

interface Props {
  item: Item
  placeholder: string
  isFocused?: boolean
  onChange: (item: Item) => void
  onKeyDown: (event, canDelete: boolean) => void
  onBlur: () => void
}

const TagInputItem: FC<Props> = ({ item, isFocused, placeholder, onChange, onKeyDown, onBlur }) => {
  const inputRef = useRef<any>(null)
  const canRemoveLast = useRef<boolean>(item.tags.length === 0)

  useEffect(() => {
    if (item.tags.length > 0) {
      canRemoveLast.current = false
    }
  }, [item.tags])

  useEffect(() => {
    if (isFocused && inputRef.current?.inputElement) {
      inputRef.current.inputElement.focus()
    }
  }, [isFocused])

  return (
    <TagInput
      className={style.wrapper}
      leftIcon={
        !!item.name?.length ? (
          <div>
            <Tag minimal className={style.title}>
              <strong>{item.name}</strong>
            </Tag>
          </div>
        ) : null
      }
      placeholder={lang(placeholder)}
      onChange={tags => onChange({ name: item.name, tags: tags as string[] })}
      inputProps={{ onBlur }}
      onKeyDown={(e, index) => {
        // Shady logic to remove the element only after all tags are deleted
        const isLast = index === undefined || index === 0
        onKeyDown(e, isLast && canRemoveLast.current)

        if (isLast && !canRemoveLast.current) {
          canRemoveLast.current = true
        }
      }}
      values={item.tags}
      tagProps={{ minimal: true }}
      ref={inputRef}
    />
  )
}

export default TagInputItem
