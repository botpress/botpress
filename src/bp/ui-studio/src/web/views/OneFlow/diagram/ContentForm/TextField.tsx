import { Position, Tooltip } from '@blueprintjs/core'
import { FormData } from 'botpress/sdk'
import { FormFields, lang, ShortcutLabel, Textarea, utils } from 'botpress/shared'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, SyntheticEvent, useEffect, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  field: any
  data: any
  label: string
  onChange: (value: FormData) => void
}

const TextAreaList: FC<Props> = props => {
  const { label, onChange, field, data } = props
  const [text, setText] = useState(data.text || '')
  const [localItems, setLocalItems] = useState(data.variations || [])
  const focusedElement = useRef(-1)

  useEffect(() => {
    setText(data.text || '')
  }, [data.text])

  useEffect(() => {
    setLocalItems(data.variations || [])
  }, [data.variations.length])

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

    if (index === -1) {
      return
    }

    const shouldDelete = !localItems[index].length

    if (e.key === 'Backspace' && shouldDelete) {
      e.preventDefault()

      deleteItem(index)
    }
  }

  const deleteItem = (index: number): void => {
    setLocalItems(localItems.filter((item, i) => i !== index))
    focusedElement.current = index - 1
    onChange({ text, variations: localItems })
  }

  return (
    <Fragment key={field.key}>
      <div className={style.items}>
        <h2>{label}</h2>
        <div className={style.textareaWrapper}>
          <Textarea
            isFocused={focusedElement.current === -1}
            className={style.customTextarea}
            placeholder={lang.tr('module.builtin.types.actionButton.sayPlaceholder')}
            onChange={value => setText(value)}
            onBlur={() => onChange({ text, variations: localItems })}
            onKeyDown={e => onKeyDown(e, -1)}
            value={text}
          />
        </div>
        {localItems?.map((item, index) => (
          <div key={index} className={style.textareaWrapper}>
            <Textarea
              isFocused={focusedElement.current === index}
              className={style.customTextarea}
              onChange={value => updateLocalItem(index, value)}
              onBlur={() => onChange({ text, variations: localItems })}
              onKeyDown={e => onKeyDown(e, index)}
              value={item}
            />
          </div>
        ))}
        <Tooltip
          content={lang.tr('module.qna.form.quickAddAlternative', {
            shortcut: <ShortcutLabel light keys={[utils.controlKey, 'enter']} />
          })}
          position={Position.BOTTOM}
        >
          <FormFields.AddButton text={lang.tr('module.builtin.types.text.add')} onClick={() => addItem()} />
        </Tooltip>
      </div>
    </Fragment>
  )
}

export default TextAreaList
