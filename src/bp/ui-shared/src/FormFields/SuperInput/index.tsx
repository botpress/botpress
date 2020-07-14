import { Button, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOMServer from 'react-dom/server'

import { FieldProps } from '../../Contents/Components/typings'
import Icons from '../../Icons'

import style from './style.scss'
import { SuperInputProps } from './typings'
import { convertToHtml, convertToString, convertToTags } from './utils'
import SuperInputDropdown from './SuperInputDropdown'

type Props = FieldProps & SuperInputProps

// TODO implement canAddElements

export default ({
  canAddElements,
  customClassName,
  events,
  variables,
  setCanOutsideClickClose,
  onBlur,
  multiple,
  value
}: Props) => {
  const [localValue, setLocalValue] = useState(value)
  const [searchString, setSearchString] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const inputRef = useRef<any>()
  const prefix = useRef('')
  const lastKnownCaretPosition = useRef<number>()
  const eventsDesc = events?.reduce((acc, event) => ({ ...acc, [event.name]: event.description }), {})
  const dropdownItems = (prefix.current === '$' ? variables : events) || []

  // TODO implement the autocomplete selection when event selected is partial

  const addPrefix = prefix => {
    let currentContent = inputRef.current?.innerHTML

    if (currentContent.endsWith('{{')) {
      currentContent = currentContent.slice(0, -2).trim()
    }
    if (currentContent.endsWith('$')) {
      currentContent = currentContent.slice(0, -1).trim()
    }

    // @ts-ignore
    inputRef.current?.innerHTML = currentContent

    if (currentContent !== '' && !currentContent.endsWith('&nbsp;')) {
      addSpace()
    }

    appendNodeToInput(document.createTextNode(prefix))
    updateSearch()
  }

  const appendNodeToInput = node => {
    inputRef.current?.appendChild(node)
  }

  const addSpace = () => {
    appendNodeToInput(document.createTextNode('\u00A0'))
  }

  const onInput = e => {
    updateSearch()
    console.log(inputRef.current?.innerHTML)
    setLocalValue(convertToString(inputRef.current?.innerHTML))
  }

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      document.execCommand('selectAll', true)

      return
    }
  }

  const getCaretPosition = () => {
    let caretPos = 0,
      sel,
      range
    if (window.getSelection) {
      sel = window.getSelection()
      if (sel.rangeCount) {
        range = sel.getRangeAt(0)
        if (range.commonAncestorContainer.parentNode == inputRef.current) {
          caretPos = range.endOffset
        }
      }
    } else if (document['selection'] && document['selection'].createRange) {
      range = document['selection'].createRange()
      if (range.parentElement() == inputRef.current) {
        const tempEl = document.createElement('span')
        inputRef.current.insertBefore(tempEl, inputRef.current.firstChild)
        const tempRange = range.duplicate()
        tempRange.moveToElementText(tempEl)
        tempRange.setEndPoint('EndToEnd', range)
        caretPos = tempRange.text.length
      }
    }
    return caretPos
  }

  const tagTemplate = (value, prefix) => {
    return ReactDOMServer.renderToStaticMarkup(
      <span title={value} contentEditable={false} spellCheck={false} tabIndex={-1} className={style.tag}>
        <span className={style.tagContentWrapper}>
          <Icon icon={prefix === '$' ? 'dollar' : <Icons.Brackets iconSize={10} />} iconSize={10} />
          <span className={style.tagValue}>{value}</span>
        </span>
      </span>
    )
  }

  const stopSearching = () => {
    prefix.current = ''
    setSearchString('')
    setIsSearching(false)
  }

  const updateSearch = () => {
    const caret = getCaretPosition()
    const currentContentTxt = inputRef.current?.innerText
    const stringBeforeCaret = currentContentTxt.substring(0, caret)
    const stringAfterCaret = currentContentTxt.substring(caret)
    let startOfWord = stringBeforeCaret.lastIndexOf(' ')
    startOfWord = startOfWord === -1 ? 0 : startOfWord + 1

    lastKnownCaretPosition.current = caret

    let endOfWord = stringAfterCaret.indexOf(' ')
    endOfWord = endOfWord === -1 ? currentContentTxt.length : stringBeforeCaret.length + endOfWord

    const currentWord = currentContentTxt.substring(startOfWord, endOfWord)

    if (currentWord.startsWith('$') || currentWord.startsWith('{{')) {
      updateSearchString(currentWord)
    } else if (isSearching) {
      stopSearching()
    }
  }

  const updateSearchString = word => {
    if (!isSearching) {
      setIsSearching(true)
    }

    const newSearchstring = word.replace('$', '').replace('{{', '')
    const oldPrefix = prefix.current
    prefix.current = word.startsWith('$') ? '$' : '{{'

    if (searchString === newSearchstring && oldPrefix !== prefix.current) {
      // Otherwise the state isn't changed if only the prefix changes
      setForceUpdate(!forceUpdate)
    } else if (searchString !== newSearchstring) {
      setSearchString(word.replace('$', '').replace('{{', ''))
    }
  }

  const filterDropdown = item => {
    return item.name.includes(searchString)
  }

  const addTag = option => {
    console.log(lastKnownCaretPosition.current)
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
      <div
        onInput={onInput}
        onKeyDown={onKeyDown}
        ref={inputRef}
        className={cx({ [style.superInput]: !customClassName }, customClassName)}
        suppressContentEditableWarning
        contentEditable
        onKeyPress={updateSearch}
        onMouseDown={updateSearch}
        onTouchStart={updateSearch}
        onMouseMove={updateSearch}
        onSelect={updateSearch}
        onPaste={updateSearch}
      >
        {value && convertToHtml(localValue!, tagTemplate)}
      </div>
      {isSearching && (
        <SuperInputDropdown
          filterable={false}
          onClick={addTag}
          items={dropdownItems
            ?.filter(filterDropdown)
            .map(({ name }) => ({ value: name, label: name, description: eventsDesc?.[name] }))}
        />
      )}
      {/*<Tags
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
              const isValid = !(data.prefix === '$'
                ? variables?.find(({ name }) => name === tagData)
                : events?.find(({ name }) => name === tagData))

              return `<tag title="${tagData}"
                contenteditable="false"
                spellcheck="false"
                tabIndex="-1"
                class="tagify__tag${isValid ? ' tagify--invalid' : ''}">
                <span>
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
              // TODO add icon when variable supports them and add variables description when they exist
              return `<div
                class='tagify__dropdown__item'
                tabindex="0"
                role="option">
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
      />*/}
    </div>
  )
}
