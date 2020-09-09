import { Button, Icon, Position, Tag, TagInput, Toaster } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, useEffect, useRef } from 'react'
import { useState } from 'react'
import { Fragment } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { lang } from '~/translations'

import ToolTip from '../../../../ui-shared-lite/ToolTip'

import { Item } from '.'
import style from './style.scss'

interface Props {
  className?: string
  canAdd: boolean
  item: Item
  placeholder: string
  refValue?: Item
  isFocused?: boolean
  onChange: (item: Item) => void
  removeItem: () => void
  addRow: () => void
  onBlur: () => void
}

const TagInputItem: FC<Props> = ({
  className,
  canAdd,
  item,
  isFocused,
  placeholder,
  onChange,
  removeItem,
  refValue,
  onBlur,
  addRow
}) => {
  const inputRef = useRef<any>(null)
  const inputVal = useRef<any>('')
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    if (isFocused && inputRef.current?.inputElement) {
      inputRef.current.inputElement.focus()
    }
  }, [isFocused])

  const onCopy = () => {
    Toaster.create({
      className: 'recipe-toaster',
      position: Position.TOP_RIGHT
    }).show({ message: lang('studio.flow.copiedToBuffer') })
  }

  const missingTranslation =
    !canAdd &&
    [refValue?.name || '', ...(refValue?.tags || [])].filter(Boolean).length !==
      [item?.name || '', ...(item?.tags || [])].filter(Boolean).length

  return (
    <Fragment>
      <div className={style.inputWrapper}>
        <TagInput
          className={cx(style.tagInput, className)}
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

            if ((e.key === 'Enter' && e.shiftKey) || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
              e.preventDefault()
              e.stopPropagation()
              addRow()
            }
          }}
          onInputChange={e => {
            inputVal.current = e.currentTarget.value
          }}
          values={item.tags || []}
          tagProps={{ minimal: true }}
          ref={inputRef}
        />
        {missingTranslation && (
          <ToolTip content={lang('studio.library.copyTags')}>
            <CopyToClipboard onCopy={onCopy} text={[refValue?.name || '', ...(refValue?.tags || [])].join(', ')}>
              <Button small minimal className={style.copyBtn}>
                <Icon icon="duplicate" iconSize={13} />
              </Button>
            </CopyToClipboard>
          </ToolTip>
        )}
      </div>
      {missingTranslation && <span className={style.error}>{lang('studio.library.mustMatchNumberOfTags')}</span>}
    </Fragment>
  )
}

export default TagInputItem
