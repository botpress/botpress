import { Button, Icon, IconName } from '@blueprintjs/core'
import Tags from '@yaireo/tagify/dist/react.tagify'
import cx from 'classnames'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { Variables } from '~/../../common/typings'

import ToolTip from '../../../../ui-shared-lite/ToolTip'
import sharedStyle from '../../style.scss'
import { lang } from '../../translations'
import { FieldProps } from '../../Contents/Components/typings'
import Icons from '../../Icons'

import style from './style.scss'
import { SuperInputProps } from './typings'
import { convertToString, convertToTags } from './utils'
import SingleSuperInput from './SingleSuperInput'

type Props = FieldProps & SuperInputProps
// Needs to be outside of react so there's a reference to the object.
// otherwise tagify (which isn't react) only has the initial copy of
// the variable list and won't update when creating new ones
let theVariables

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
  isPartOfArray,
  onBlur,
  className,
  value,
  refValue,
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

  const filterVariables = (variables?: Variables) =>
    variables?.currentFlow
      ?.filter(typeFilter)
      .map(({ params }) => params?.name)
      .filter(Boolean) || []

  const initialValue = useRef<string>((value && convertToTags(value)) || (refValue && convertToTags(refValue)) || '')
  const newlyAddedVar = useRef<string[]>([])
  const currentPrefix = useRef<string>()
  const tagifyRef = useRef<any>()
  const [localVariables, setLocalVariables] = useState(filterVariables(variables))
  const [localEvents, setLocalEvents] = useState(events?.map(({ name }) => name) || [])
  const eventsDesc = events?.reduce((acc, event) => ({ ...acc, [event.name]: event.description }), {})
  // TODO implement the autocomplete selection when event selected is partial

  useEffect(() => {
    setLocalVariables(filterVariables(variables))
    theVariables = filterVariables(variables)
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
          tagifyRef.current.settings.whitelist = theVariables
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
        tagifyRef.current.settings.whitelist = theVariables
      }

      if (prefix === '{{') {
        // TODO refactor to use the schema format properly and allow to breakdown into an object type search
        tagifyRef.current.settings.whitelist = localEvents
      }
    }
  }

  if (isPartOfArray) {
    tagifyCallbacks['paste'] = e => {
      e.preventDefault()
    }
  }

  const onAddVariable = (value, list) => {
    const isAdding = !list.includes(value)

    if (isAdding) {
      const newVariable = {
        type: defaultVariableType || 'string',
        params: {
          name: value
        }
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
        allVariables={variables}
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

  const missingTranslation = !isPartOfArray && refValue && !value

  return (
    <Fragment>
      <div
        className={cx(style.superInputWrapper, className, 'superinput-wrapper', {
          [style.singular]: !isPartOfArray,
          ['has-error']: missingTranslation
        })}
      >
        {
          <div className={cx(style.tagBtnWrapper, 'tag-btn-wrapper')}>
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
                const type = variables?.currentFlow?.find(x => x.params?.name === value)?.type
                const icon = variables?.primitive.find(x => x.id === type)?.config?.icon

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
                    <Icon icon={icon} iconSize={10} /> {string}
                    <span className="description">{eventsDesc?.[value] || ''}</span>
                  </div>
                )
              },
              tag({ prefix, value }) {
                const isInvalid = !(prefix === '$'
                  ? [...localVariables, ...newlyAddedVar.current]
                  : localEvents
                ).includes(value)

                let icon, suffix

                if (isInvalid) {
                  icon = <Icon icon="error" iconSize={10} />
                } else {
                  icon = prefix
                  suffix = prefix === '{{' ? '}}' : ''
                }

                return (
                  <span
                    title={value}
                    contentEditable={false}
                    spellCheck={false}
                    tabIndex={-1}
                    className={cx('tagify__tag', { ['tagify--invalid']: isInvalid })}
                  >
                    <span className="tagify__tag-text">
                      {icon}
                      {value}
                      {suffix}
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
      {missingTranslation && <span className={sharedStyle.error}>{lang('pleaseTranslateField')}</span>}
    </Fragment>
  )
}
