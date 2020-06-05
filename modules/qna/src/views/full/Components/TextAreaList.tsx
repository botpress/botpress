import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
// @ts-ignore
import BotpressContentPicker from 'botpress/content-picker'
// @ts-ignore
import BotpressContentTypePicker from 'botpress/content-type-picker'
import { lang, ShortcutLabel, Textarea, utils } from 'botpress/shared'
import cx from 'classnames'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from '../style.scss'

interface Props {
  updateItems: (items: string[]) => void
  items: string[]
  placeholder: (index: number) => void
  itemListValidator: (items: string[], errorMsg: string) => string[]
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
  const [localItems, setLocalItems] = useState(props.items)
  // Generating unique keys so we don't need to rerender all the list as soon as we add or delete one element
  const [keys, setKeys] = useState(localItems.map(x => _uniqueId(keyPrefix)))
  const { duplicateMsg, updateItems, keyPrefix, canAddContent, addItemLabel, label, refItems, placeholder } = props
  const focusedElement = useRef(props.initialFocus || '')

  useEffect(() => {
    setKeys(localItems.map(x => _uniqueId(keyPrefix)))
  }, [refItems])

  const updateLocalItem = (index: number, value: string): void => {
    localItems[index] = value
    setLocalItems([...localItems])
  }

  const addItem = (value = ''): void => {
    localItems.push(value)
    setKeys([...keys, _uniqueId(keyPrefix)])
    focusedElement.current = `${keyPrefix}${localItems.length - 1}`
    updateItems(localItems)
  }

  const onKeyDown = (e: KeyboardEvent, index: number): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      addItem()
    }

    const shouldDelete = localItems.length > 1 && !localItems[index].length

    if (e.key === 'Backspace' && shouldDelete) {
      e.preventDefault()

      deleteItem(index)
    }
  }

  const deleteItem = (index: number): void => {
    localItems.splice(index, 1)
    setKeys([...keys.filter((key, i) => index !== i)])
    focusedElement.current = `${keyPrefix}${index === 0 ? 0 : index - 1}`

    updateItems(localItems)
  }

  const errors = props.itemListValidator(localItems, duplicateMsg)

  return (
    <Fragment>
      <div className={style.items}>
        <h2>{label}</h2>
        {localItems?.map((item, index) =>
          canAddContent && item.startsWith('#!') ? (
            <div key={keys[index]} className={style.contentAnswer}>
              <BotpressContentPicker
                itemId={item.replace('#!', '')}
                onClickChange={() => this.toggleEditMode(index)}
                onChange={this.onContentChange}
              />
              <Button icon="trash" onClick={() => deleteItem(index)} />
            </div>
          ) : (
            <div key={keys[index]} className={style.textareaWrapper}>
              <Textarea
                isFocused={focusedElement.current === `${keyPrefix}${index}`}
                className={cx(style.textarea, { [style.hasError]: errors[index] })}
                placeholder={refItems?.[index] ? refItems[index] : placeholder(index)}
                onChange={value => updateLocalItem(index, value)}
                onBlur={() => updateItems(localItems)}
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
        <Tooltip
          content={lang.tr('module.qna.form.quickAddAlternative', {
            shortcut: <ShortcutLabel light keys={[utils.controlKey, 'enter']} />
          })}
          position={Position.BOTTOM}
        >
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
