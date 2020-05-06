import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
// @ts-ignore
import BotpressContentPicker from 'botpress/content-picker'
// @ts-ignore
import BotpressContentTypePicker from 'botpress/content-type-picker'
import { lang, ShortcutLabel, Textarea } from 'botpress/shared'
import cx from 'classnames'
import { debounce } from 'lodash'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useCallback, useEffect, useRef, useState } from 'react'

import style from '../style.scss'

interface Props {
  updateItems: (items: string[]) => void
  items: string[]
  placeholder: (index: number) => void
  addItemLabel: string
  label: string
  refItems: string[]
  keyPrefix: string
  showPicker?: boolean
  initialFocus?: string
  duplicateMsg?: string
  canAddContent?: boolean
}

const TextAreaList: FC<Props> = props => {
  const [showPicker, setShowPicker] = useState(false)
  const {
    items,
    duplicateMsg,
    updateItems,
    keyPrefix,
    canAddContent,
    addItemLabel,
    label,
    refItems,
    placeholder
  } = props
  const focusedElement = useRef(props.initialFocus || '')

  useEffect(() => {
    keys.current = items.map(x => _uniqueId(keyPrefix))
  }, [refItems])

  // Generating unique keys so we don't need to rerender all the list as soon as we add or delete one element
  const keys = useRef(items.map(x => _uniqueId(keyPrefix)))

  const updateItem = (index: number, value: string): void => {
    items[index] = value
    updateItems(items)
  }

  const debounceUpdateItem = useCallback(debounce(updateItem, 300), [])

  const addItem = (value = ''): void => {
    items.push(value)
    keys.current.push(_uniqueId(keyPrefix))
    focusedElement.current = `${keyPrefix}${items.length - 1}`
    updateItems(items)
  }

  const onKeyDown = (e: KeyboardEvent, index: number): void => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      addItem()
    }

    if (e.key === 'Backspace' && items.length > 1 && !items[index].length) {
      e.preventDefault()

      items.splice(index, 1)
      keys.current.splice(index, 1)
      focusedElement.current = `${keyPrefix}${index === 0 ? 0 : index - 1}`

      updateItems(items)
    }
  }

  const errors = items.map((item, index) =>
    items
      .slice(0, index)
      .filter(item2 => item2.length)
      .includes(item)
      ? duplicateMsg
      : ''
  )

  return (
    <Fragment>
      <div className={style.items}>
        <h2>{label}</h2>
        {items?.map((item, index) =>
          canAddContent && item.startsWith('#!') ? (
            <div key={keys.current[index]} className={style.contentAnswer}>
              <BotpressContentPicker
                itemId={item.replace('#!', '')}
                onClickChange={() => this.toggleEditMode(index)}
                onChange={this.onContentChange}
              />
            </div>
          ) : (
            <div key={keys.current[index]} className={style.textareaWrapper}>
              <Textarea
                isFocused={focusedElement.current === `${keyPrefix}${index}`}
                className={cx(style.textarea, { [style.hasError]: errors[index] })}
                placeholder={refItems?.[index] ? refItems[index] : placeholder(index)}
                onChange={value => debounceUpdateItem(index, value)}
                onKeyDown={e => onKeyDown(e, index)}
                value={item}
              />
              {errors[index] && (
                <div className={style.errorIcon}>
                  <Tooltip content={errors[index]} position={Position.BOTTOM}>
                    <Icon icon="warning-sign" />
                  </Tooltip>
                </div>
              )}
            </div>
          )
        )}
        <Tooltip content={<ShortcutLabel light keys={['shift', 'enter']} />} position={Position.BOTTOM}>
          <Button className={style.addBtn} minimal icon="plus" onClick={() => addItem()}>
            {addItemLabel}
          </Button>
        </Tooltip>

        {canAddContent && (
          <Button className={style.addBtn} minimal icon="plus" onClick={() => setShowPicker(true)}>
            {lang.tr('module.qna.form.addContent')}
          </Button>
        )}
      </div>
      {showPicker && canAddContent && (
        <BotpressContentTypePicker
          show={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={item => addItem(`#!${item.id}`)}
          container={document.getElementsByTagName('body')[0]}
        />
      )}
    </Fragment>
  )
}

export default TextAreaList
