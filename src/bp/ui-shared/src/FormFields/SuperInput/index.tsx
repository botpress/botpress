import { Button, Icon, Menu, MenuItem, Popover, Position } from '@blueprintjs/core'
import Tags from '@yaireo/tagify/dist/react.tagify'
import React, { Fragment, useRef, useState } from 'react'
import ReactDOMServer from 'react-dom/server'

import { FieldProps } from '../../Contents/Components/typings'
import Dropdown from '../../Dropdown'
import Icons from '../../Icons'

import style from './style.scss'
import { SuperInputProps } from './typings'
import { convertToString, convertToTags } from './utils'

type Props = FieldProps & SuperInputProps

// TODO implement canAddElements

export default ({ canAddElements, events, multiple, variables, setCanOutsideClickClose, onBlur, value }: Props) => {
  const tagifyRef = useRef<any>()
  const eventsDesc = events?.reduce((acc, event) => ({ ...acc, [event.name]: event.description }), {})

  // TODO implement the autocomplete selection when event selected is partial

  const tagifyCallbacks = {
    input: e => {
      const prefix = e.detail.prefix

      if (prefix && multiple) {
        if (prefix === '$') {
          tagifyRef.current.settings.whitelist = variables?.map(({ name }) => name) || []
        }

        if (prefix === '{{') {
          // TODO refactor to use the schema format properly and allow to breakdown into an object type search
          tagifyRef.current.settings.whitelist = events?.map(({ name }) => name) || []
        }

        if (e.detail.value.length > 1) {
          e.detail.tagify.dropdown.show.call(e.detail.tagify, e.detail.value)
        }
      }
    },
    keydown: e => {
      const originalEvent = e.detail.originalEvent

      if ((originalEvent.ctrlKey || originalEvent.metaKey) && originalEvent.key === 'a') {
        document.execCommand('selectAll', true)
      }
    },
    ['dropdown:show']: e => {
      setCanOutsideClickClose?.(false)
    },
    ['edit:start']: e => {
      const prefix = e.detail.data.prefix

      if (prefix === '$') {
        tagifyRef.current.settings.whitelist = variables?.map(({ name }) => name) || []
      }

      if (prefix === '{{') {
        // TODO refactor to use the schema format properly and allow to breakdown into an object type search
        tagifyRef.current.settings.whitelist = events?.map(event => event.name) || []
      }
    }
  }

  const addPrefix = prefix => {
    let currentContent = tagifyRef.current?.DOM.input.innerHTML

    if (currentContent.endsWith('{{')) {
      currentContent = currentContent.slice(0, -2).trim()
    }
    if (currentContent.endsWith('$')) {
      currentContent = currentContent.slice(0, -1).trim()
    }

    // @ts-ignore
    tagifyRef.current?.DOM?.input?.innerHTML = currentContent

    if (currentContent !== '' && !currentContent.endsWith('&nbsp;')) {
      addSpace()
    }

    appendNodeToInput(document.createTextNode(prefix))
    moveCarretToEndOfString()
  }

  const appendNodeToInput = node => {
    tagifyRef.current?.DOM.input.appendChild(node)
  }

  const addSpace = () => {
    appendNodeToInput(document.createTextNode('\u00A0'))
  }

  const moveCarretToEndOfString = () => {
    tagifyRef.current?.DOM.input.focus()
    document.execCommand('selectAll', false)
    document.getSelection()?.collapseToEnd()
    tagifyRef.current?.DOM.input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (!multiple) {
    const tag =
      value &&
      JSON.parse(
        convertToTags(value)
          .replace('[[', '')
          .replace(']]', '')
      )

    return (
      <div className={style.superInputWrapper}>
        <div className={style.singularTagBtnWrapper}>
          <Dropdown
            items={events?.map(({ name }) => ({ value: name, label: name })) || []}
            icon={<Icons.Brackets />}
            onChange={({ value }) => {
              onBlur?.(`{{${value}}}`)
            }}
          />
          <Dropdown
            items={variables?.map(({ name }) => ({ value: name, label: name })) || []}
            icon="dollar"
            onChange={({ value }) => {
              onBlur?.(`$${value}`)
            }}
          />
        </div>
        <div className={style.superInput}>
          {tag && (
            <span title={tag.value} tabIndex={-1} className="tagify__tag">
              <span>
                <Icon icon={tag.prefix === '$' ? 'dollar' : <Icons.Brackets iconSize={10} />} iconSize={10} />
                <span className="tagify__tag-text">{tag.value}</span>
              </span>
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={style.superInputWrapper}>
      <div className={style.tagBtnWrapper}>
        <Button
          className={style.tagBtn}
          onClick={() => {
            addPrefix('{{')
          }}
          icon={<Icons.Brackets />}
        />
        <Button
          className={style.tagBtn}
          onClick={() => {
            addPrefix('$')
          }}
          icon="dollar"
        />
      </div>
      <Tags
        className={style.superInput}
        tagifyRef={tagifyRef}
        settings={{
          dropdown: {
            classname: 'color-blue',
            enabled: 0,
            maxItems: 5,
            position: 'below',
            closeOnSelect: true,
            highlightFirst: true
          },
          skipInvalid: !canAddElements,
          templates: {
            tag(tagData, data) {
              const isValid = (data.prefix === '$' ? variables : events)?.find(({ name }) => name === tagData)

              return `<tag title="${tagData}"
                contenteditable="false"
                spellcheck="false"
                tabIndex="-1"
                class="tagify__tag${isValid ? '' : ' tagify--invalid'}">
                <div>
                  ${ReactDOMServer.renderToStaticMarkup(
                    <Icon icon={data.prefix === '$' ? 'dollar' : <Icons.Brackets iconSize={10} />} iconSize={10} />
                  )}
                  <span class="tagify__tag-text">${tagData}</span>
                </span>
              </tag>`
            },
            dropdown(settings) {
              return `<div class="${style.dropdown} tagify__dropdown tagify__dropdown--below" role="listbox" aria-labelledby="dropdown">
                  <div class="tagify__dropdown__wrapper"></div>
              </div>`
            },
            dropdownItem(item) {
              const isAdding = !tagifyRef.current.settings.whitelist.includes(item.value)
              // TODO add icon when variable supports them and add variables description when they exist
              return `<div
                class='tagify__dropdown__item ${isAdding && style.addingItem}'
                tabindex="0"
                role="option">
                ${(isAdding && ReactDOMServer.renderToStaticMarkup(<Icon icon="plus" iconSize={12} />)) || ''}
                ${item.value}
                ${`<span class="description">${eventsDesc?.[item.value] || ''}</span>`}
              </div>`
            }
          },
          duplicates: true,
          callbacks: tagifyCallbacks,
          mode: 'mix',
          pattern: /\$|{{/
        }}
        value={convertToTags(value!)}
        onChange={e => (e.persist(), onBlur?.(convertToString(e.target.value)))}
      />
    </div>
  )
}
