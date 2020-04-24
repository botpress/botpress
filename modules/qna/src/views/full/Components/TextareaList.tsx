import { Button } from '@blueprintjs/core'
// @ts-ignore
import BotpressContentPicker from 'botpress/content-picker'
// @ts-ignore
import BotpressContentTypePicker from 'botpress/content-type-picker'
import { lang, Textarea } from 'botpress/shared'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useRef, useState } from 'react'

import style from '../style.scss'

interface Props {
  updateItems: (items: any) => void
  items: string[]
  placeholder: (index: number) => void
  addItemLabel: string
  label: string
  keyPrefix: string
  showPicker?: boolean
  initialFocus?: string
  canAddContent?: boolean
}

const TextareaList: FC<Props> = props => {
  const [showPicker, setShowPicker] = useState(false)
  const focusedElement = useRef(props.initialFocus || '')
  const { updateItems, keyPrefix, canAddContent, addItemLabel, label, items, placeholder } = props

  // Generating unique keys so we don't need to rerender all the list as soon as we add or delete one element
  const keys = useRef([...Array(items.length)].map(x => _uniqueId(keyPrefix)))

  const updateItem = (index, value) => {
    items[index] = value
    updateItems(items)
  }

  const addItem = (value = '') => {
    items.push(value)
    keys.current.push(_uniqueId(keyPrefix))
    focusedElement.current = `${keyPrefix}${items.length - 1}`
    updateItems(items)
  }

  const onKeyDown = (e, index) => {
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

  return (
    <Fragment>
      <div className={style.items}>
        <h2>{label}</h2>
        {!!items?.length &&
          items?.map((value, index) =>
            canAddContent && value.startsWith('#!') ? (
              <div key={keys.current[index]} className={style.contentAnswer}>
                <BotpressContentPicker
                  itemId={value.replace('#!', '')}
                  onClickChange={() => this.toggleEditMode(index)}
                  onChange={this.onContentChange}
                />
              </div>
            ) : (
              <Textarea
                key={keys.current[index]}
                isFocused={focusedElement.current === `${keyPrefix}${index}`}
                className={style.textarea}
                placeholder={placeholder(index)}
                onChange={e => updateItem(index, e.currentTarget.value)}
                onKeyDown={e => onKeyDown(e, index)}
                value={value}
              />
            )
          )}
        <Button className={style.addBtn} minimal icon="plus" onClick={() => addItem()}>
          {addItemLabel}
        </Button>

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

export default TextareaList
