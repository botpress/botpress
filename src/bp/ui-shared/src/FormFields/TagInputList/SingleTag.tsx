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

export const SingleTag: FC<Props> = ({ item, isFocused, placeholder, onChange, onKeyDown, onBlur }) => {
  const inputRef = useRef<any>(null)
  const canRemoveLast = useRef<boolean>(item.synonyms.length === 0)

  useEffect(() => {
    if (item.synonyms.length > 0) {
      canRemoveLast.current = false
    }
  }, [item.synonyms])

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
      onChange={synonyms => onChange({ name: item.name, synonyms: synonyms as string[] })}
      inputProps={{ onBlur }}
      onKeyDown={(e, index) => {
        // Shady logic to remove the element only after all synonyms are deleted
        const isLast = index === undefined || index === 0
        onKeyDown(e, isLast && canRemoveLast.current)

        if (isLast && !canRemoveLast.current) {
          canRemoveLast.current = true
        }
      }}
      values={item.synonyms}
      tagProps={{ minimal: true }}
      ref={inputRef}
    />
  )
}
