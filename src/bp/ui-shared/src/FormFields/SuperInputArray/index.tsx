import { Position, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import _isEqual from 'lodash/isEqual'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useRef, useState } from 'react'

import sharedStyle from '../../style.scss'
import { lang } from '../../translations'
import AddButton from '../../Contents/Components/Fields/AddButton'
import SuperInput from '../SuperInput'
import { convertToString } from '../SuperInput/utils'

import style from './style.scss'
import { SuperInputArrayProps } from './typings'

const addListenerWithArgs = (el, event, callbackMethod, extraParams) => {
  const method = (function(callbackMethod, extraParams) {
    return e => {
      callbackMethod(e, extraParams)
    }
  })(callbackMethod, extraParams)

  el.addEventListener(event, method)

  return method
}

const SuperInputArray: FC<SuperInputArrayProps> = ({
  canPickEvents = true,
  canPickVariables = true,
  variableTypes,
  addBtnLabel,
  addBtnLabelTooltip,
  label,
  onChange,
  moreInfo,
  refValue,
  items,
  getPlaceholder,
  variables,
  events,
  onUpdateVariables
}) => {
  const getInitialItems = () => {
    let localItems = [...(items?.length ? items : [''])]
    const diff = (refValue || []).length - items?.length

    if (diff > 0) {
      localItems = localItems.concat(Array(diff).fill(''))
    }

    return localItems
  }

  const [elRefs, setElRefs] = useState({})
  const initialItems = getInitialItems()
  const [localItems, setLocalItems] = useState(initialItems)
  const skipBlur = useRef(false)
  const focusedElement = useRef(initialItems.length)
  const itemIds = useRef(initialItems.map(i => _uniqueId()))

  useEffect(() => {
    const keydownEvent = {}
    const pasteEvent = {}
    const blurEvent = {}
    // If we don't recreate this everytime the refs or items change, the updates will have outdated states
    Object.keys(elRefs).forEach((key, index) => {
      keydownEvent[key] = addListenerWithArgs(elRefs[key].DOM.input, 'keydown', onKeyDown, index)
      pasteEvent[key] = addListenerWithArgs(elRefs[key].DOM.input, 'paste', onPaste, index)
      blurEvent[key] = addListenerWithArgs(elRefs[key].DOM.input, 'blur', updateItems, index)
    })

    return () =>
      Object.keys(elRefs).forEach(key => {
        elRefs[key].DOM.input.removeEventListener('keydown', keydownEvent[key])
        elRefs[key].DOM.input.removeEventListener('paste', pasteEvent[key])
        elRefs[key].DOM.input.removeEventListener('blur', blurEvent[key])
      })
  }, [elRefs, localItems, variables?.currentFlow?.length])

  const onPaste = (e, index) => {
    const clipboardData = e.clipboardData
    const pastedData = clipboardData.getData('Text')

    addLines(pastedData.split(/\r?\n/))
  }

  const addItem = (): void => {
    focusedElement.current = localItems.length
    itemIds.current = [...itemIds.current, _uniqueId()]
    const newItems = [...localItems, '']

    setLocalItems(newItems)
  }

  const deleteItem = (index: number): void => {
    const newItems = localItems.filter((item, i) => i !== index)

    itemIds.current = itemIds.current.filter((item, i) => i !== index)
    focusedElement.current = index - 1
    skipBlur.current = true
    setLocalItems([...newItems])
    removeRefandRearrange(index)
    onChange([...newItems])
  }

  const removeRefandRearrange = index => {
    const numIndex = Number(index)
    let newRefs = elRefs

    delete newRefs[index]

    newRefs = Object.keys(newRefs).reduce((acc, key) => {
      const numKey = Number(key)
      const newKey = numKey > numIndex ? numKey - 1 : numKey
      return { ...acc, [newKey]: newRefs[key] }
    }, {})

    setElRefs(newRefs)
  }

  const updateItems = (e, index): void => {
    if (!skipBlur.current) {
      if (localItems[index] !== undefined) {
        localItems[index] = convertToString(elRefs[index]?.DOM.originalInput.value)
        setLocalItems([...localItems])
        onChange([...localItems])
      }
    } else {
      skipBlur.current = false
    }
  }

  const onKeyDown = (e, index): void => {
    if (
      e.key === 'Enter' &&
      !(e.ctrlKey || e.metaKey || e.shiftKey) &&
      elRefs[index]?.DOM?.input?.parentElement?.getAttribute('aria-expanded') !== 'true'
    ) {
      e.preventDefault()
      addItem()
    }

    const shouldDelete = !elRefs[index]?.DOM.originalInput.value.length && localItems.length > 1

    if (e.key === 'Backspace' && shouldDelete) {
      e.preventDefault()

      deleteItem(index)
    }
  }

  const addLines = items => {
    const newItems = [...localItems, ...items]
    itemIds.current = [...itemIds.current, ...items.map(() => _uniqueId())]
    focusedElement.current = newItems.length - 1

    setLocalItems([...newItems])
  }

  const missingTranslation = !!refValue?.filter(Boolean).length && !localItems.filter(Boolean).length

  return (
    <div className={sharedStyle.items}>
      <h2>{label}</h2>
      {moreInfo}
      {localItems?.map((item, index) => {
        return (
          <div
            key={itemIds.current[index]}
            className={cx(sharedStyle.textareaWrapper, { ['has-error']: missingTranslation })}
          >
            <SuperInput
              isFocused={focusedElement.current === index}
              placeholder={getPlaceholder?.(index)}
              variableTypes={variableTypes}
              className={cx(sharedStyle.textarea, { ['has-error']: missingTranslation })}
              canPickEvents={canPickEvents}
              canPickVariables={canPickVariables}
              addLines={addLines}
              isPartOfArray
              multiple
              variables={variables}
              events={events || []}
              addVariable={onUpdateVariables}
              childRef={(ref: any) => {
                setElRefs(elRefs => ({ ...elRefs, [index]: ref }))
              }}
              refValue={refValue?.[index]}
              value={item}
            />
          </div>
        )
      })}
      {missingTranslation && <span className={sharedStyle.error}>{lang('pleaseTranslateField')}</span>}

      <Tooltip content={lang(addBtnLabelTooltip || 'quickAddAlternative')} position={Position.BOTTOM}>
        <AddButton text={addBtnLabel} onClick={() => addItem()} />
      </Tooltip>
    </div>
  )
}

export default SuperInputArray
