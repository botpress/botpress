import { Position, Tooltip } from '@blueprintjs/core'
import { FormFields, lang, ShortcutLabel, Textarea, utils } from 'botpress/shared'
import { FormData } from 'common/typings'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, SyntheticEvent, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  field: any
  data: FormData
  label: string
  onChange: (value: string[]) => void
}

const TextAreaList: FC<Props> = props => {
  const [localItems, setLocalItems] = useState([])
  const { label, onChange, field, data } = props
  const focusedElement = useRef(-1)

  const updateLocalItem = (index: number, value: string): void => {
    localItems[index] = value
    setLocalItems([...localItems])
  }

  const addItem = (value = ''): void => {
    focusedElement.current = localItems.length
    setLocalItems([...localItems, ''])
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
    focusedElement.current = index === 0 ? 0 : index - 1
    onChange(localItems)
  }

  const placeholder = (index: number): string => {
    if (index === 0) {
      return lang.tr('What will your chatbot say?')
    }

    return ''
  }

  return (
    <Fragment key={field.key}>
      <div className={style.items}>
        <h2>{label}</h2>
        {localItems?.map((item, index) => (
          <div key={index} className={style.textareaWrapper}>
            <Textarea
              isFocused={focusedElement.current === index}
              className={style.customTextarea}
              placeholder={placeholder(index)}
              onChange={value => updateLocalItem(index, value)}
              onBlur={() => onChange(localItems)}
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
