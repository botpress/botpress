import { Button, Icon, IconName } from '@blueprintjs/core'
import Tags from '@yaireo/tagify/dist/react.tagify'
import cx from 'classnames'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import { lang } from '../../translations'
import { FieldProps } from '../../Contents/Components/typings'
import Icons from '../../Icons'

import style from './style.scss'
import { SuperInputProps } from './typings'
import { convertToString, convertToTags } from './utils'
import SingleSuperInput from './SingleSuperInput'
import ToolTip from '../../../../ui-shared-lite/ToolTip'

type Props = FieldProps & SuperInputProps

export default ({
  canAddElements = true,
  canPickEvents = true,
  canPickVariables = true,
  defaultVariableType,
  variableTypes,
  events,
  multiple,
  variables,
  addVariable,
  onChange,
  onBlur,
  className,
  value,
  childRef,
  isFocused,
  placeholder
}: Props) => {
  const typeFilter = ({ type }) => {
    if (variableTypes) {
      return variableTypes.includes(type)
    } else if (defaultVariableType) {
      return type === defaultVariableType
    }

    return true
  }

  const initialValue = useRef<string>((value && convertToTags(value)) || '')
  const newlyAddedVar = useRef<string[]>([])
  const currentPrefix = useRef<string>()
  const tagifyRef = useRef<any>()
  const [localVariables, setLocalVariables] = useState(
    variables?.filter(typeFilter).map(({ params }) => params?.name) || []
  )
  const [localEvents, setLocalEvents] = useState(events?.map(({ name }) => name) || [])
  const eventsDesc = events?.reduce((acc, event) => ({ ...acc, [event.name]: event.description }), {})
  // TODO implement the autocomplete selection when event selected is partial

  useEffect(() => {
    setLocalVariables(variables?.filter(typeFilter).map(({ params }) => params.name) || [])
  }, [variables])

  useEffect(() => {
    setLocalEvents(events?.map(({ name }) => name) || [])
  }, [events])

  useEffect(() => {
    childRef?.(tagifyRef.current)
  }, [tagifyRef.current])

  useEffect(() => {
    if (tagifyRef.current && isFocused) {
      setTimeout(() => moveCarretToEndOfString())
    }
  }, [isFocused])

  const onKeyDown = e => {
    const originalEvent = e.detail.originalEvent
    const metaKey = originalEvent.ctrlKey || originalEvent.metaKey

    if (metaKey && originalEvent.key === 'a') {
      document.execCommand('selectAll', true)
    }
  }

  const tagifyCallbacks = {
    add: e => {
      onAddVariable(e.detail.data.value, tagifyRef.current.settings.whitelist)
    },
    blur: e => {
      onBlur?.(convertToString(tagifyRef.current?.DOM.originalInput.value))
    },
    ['dropdown:select']: e => {
      const value = e.detail.data.value
      const isAdding = !tagifyRef.current.settings.whitelist.includes(value)
      if (isAdding) {
        newlyAddedVar.current = [...newlyAddedVar.current, value]
      }
    },
    input: e => {
      const prefix = e.detail.prefix
      currentPrefix.current = prefix

      onChange?.(tagifyRef.current?.DOM.originalInput.value)

      if (prefix && multiple) {
        if (prefix === '$') {
          tagifyRef.current.settings.whitelist = localVariables
        }

        if (prefix === '{{') {
          // TODO refactor to use the schema format properly and allow to breakdown into an object type search
          tagifyRef.current.settings.whitelist = localEvents
        }

        if (e.detail.value.length > 1) {
          e.detail.tagify.dropdown.show.call(e.detail.tagify, e.detail.value)
        }
      }
    },
    keydown: onKeyDown,
    ['edit:start']: e => {
      const prefix = e.detail.data.prefix

      if (prefix === '$') {
        tagifyRef.current.settings.whitelist = localVariables
      }

      if (prefix === '{{') {
        // TODO refactor to use the schema format properly and allow to breakdown into an object type search
        tagifyRef.current.settings.whitelist = localEvents
      }
    }
  }

  const onAddVariable = (value, list) => {
    const isAdding = !list.includes(value)

    if (isAdding) {
      const newVariable = {
        type: defaultVariableType || 'string',
        name: value
      }

      addVariable?.(newVariable)
    }
  }

  const addPrefix = prefix => {
    const input = tagifyRef.current?.DOM.input
    const lastChildNode = input.lastChild
    const isTag = lastChildNode?.getAttribute ? lastChildNode.getAttribute('class').includes('tagify__tag') : false
    let lastChild = lastChildNode?.wholeText || ''

    if (lastChild.endsWith('{{') || lastChild.endsWith('$')) {
      lastChild = lastChild.replace('{{', '').replace('$', '')
    }

    if (lastChildNode && !isTag) {
      const addSpace = !(lastChild.endsWith('&nbsp;') || lastChild.endsWith(' ') || input.innerTEXT === '')

      input.replaceChild(document.createTextNode(`${lastChild}${addSpace ? ' ' : ''}${prefix}`), lastChildNode)
    } else {
      input.appendChild(document.createTextNode(`${isTag ? ' ' : ''}${prefix}`))
    }

    moveCarretToEndOfString()
  }

  const moveCarretToEndOfString = () => {
    tagifyRef.current?.DOM.input.focus()
    document.execCommand('selectAll', false)
    document.getSelection()?.collapseToEnd()
    tagifyRef.current?.DOM.input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (!multiple) {
    return (
      <SingleSuperInput
        canPickEvents={canPickEvents}
        canPickVariables={canPickVariables}
        events={localEvents}
        variables={localVariables}
        onAddVariable={onAddVariable}
        eventsDesc={eventsDesc}
        value={value}
        onBlur={onBlur}
      />
    )
  }

  const getPattern = () => {
    if (canPickVariables && canPickEvents) {
      return /\$|{{/
    } else if (canPickVariables) {
      return /\$/
    } else if (canPickEvents) {
      return /{{/
    }
  }

  return (
    <div className={cx(style.superInputWrapper, className, 'superinput-wrapper')}>
      {
        <div className={style.tagBtnWrapper}>
          {canPickEvents && (
            <ToolTip content={lang('superInput.insertValueFromEvent')} hoverOpenDelay={300} position="top">
              <Button
                className={style.tagBtn}
                onClick={() => {
                  addPrefix('{{')
                }}
                icon={<Icons.Brackets />}
              />
            </ToolTip>
          )}
          {canPickVariables && (
            <ToolTip content={lang('superInput.insertValueFromVariables')} hoverOpenDelay={300} position="top">
              <Button
                className={style.tagBtn}
                onClick={() => {
                  addPrefix('$')
                }}
                icon="dollar"
              />
            </ToolTip>
          )}
        </div>
      }
      <Tags
        placeholder={placeholder}
        className={style.superInput}
        tagifyRef={tagifyRef}
        InputMode="textarea"
        settings={{
          dropdown: {
            classname: 'color-blue',
            enabled: 0,
            maxItems: 5,
            position: 'below',
            closeOnSelect: true,
            highlightFirst: true
          },
          templates: {
            dropdown(settings) {
              return (
                <div
                  className={cx(style.dropdown, 'tagify__dropdown tagify__dropdown--below')}
                  role="listbox"
                  aria-labelledby="dropdown"
                >
                  <div className="tagify__dropdown__wrapper"></div>
                </div>
              )
            },
            dropdownItem({ value, tagifySuggestionIdx }) {
              const isAdding = !tagifyRef.current.settings.whitelist.includes(value)
              const string = isAdding ? `"${value}"` : value

              if (isAdding && (currentPrefix.current === '{{' || !canAddElements)) {
                return null
              }

              return (
                <div
                  {...{ tagifysuggestionidx: tagifySuggestionIdx }}
                  className={cx('tagify__dropdown__item', { [style.addingItem]: isAdding })}
                  tabIndex={0}
                  role="option"
                >
                  {isAdding && (
                    <Fragment>
                      <Icon icon="plus" iconSize={12} />
                      {lang('create')}
                    </Fragment>
                  )}
                  {string}
                  <span className="description">{eventsDesc?.[value] || ''}</span>
                </div>
              )
            },
            tag({ prefix, value }) {
              const isInvalid = !(prefix === '$'
                ? [...localVariables, ...newlyAddedVar.current]
                : localEvents
              ).includes(value)

              let icon: IconName | JSX.Element = <Icons.Brackets iconSize={10} />

              if (isInvalid) {
                icon = 'error'
              } else if (prefix === '$') {
                icon = 'dollar'
              }

              return (
                <span
                  title={value}
                  contentEditable={false}
                  spellCheck={false}
                  tabIndex={-1}
                  className={cx('tagify__tag', { ['tagify--invalid']: isInvalid })}
                >
                  <span>
                    <Icon icon={icon} iconSize={10} />
                    <span className="tagify__tag-text">{value}</span>
                  </span>
                </span>
              )
            }
          },
          duplicates: true,
          callbacks: tagifyCallbacks,
          mode: 'mix',
          pattern: getPattern()
        }}
        defaultValue={initialValue.current}
        onChange={e => {
          onChange?.(convertToString(e.currentTarget.value))
        }}
      />
    </div>
  )
}
