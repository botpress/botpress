import { Button, Icon } from '@blueprintjs/core'
import Tags from '@yaireo/tagify/dist/react.tagify'
import React, { useRef, useState } from 'react'
import ReactDOMServer from 'react-dom/server'

// TODO move fields and props to FormFields dir
import { FieldProps } from '../../Contents/Components/typings'
import Icons from '../../Icons'

import style from './style.scss'
import { SuperInputProps } from './typings'
import { convertToString, convertToTags } from './utils'

type Props = FieldProps & SuperInputProps

// TODO implement canAddElements

export default ({ canAddElements, events, variables, setCanOutsideClickClose, onBlur, value }: Props) => {
  const [currentWhitelist, setCurrentWhitelist] = useState<string[]>([])
  const tagifyRef = useRef<any>()

  const tagifyCallbacks = {
    input: e => {
      const prefix = e.detail.prefix

      if (prefix) {
        if (prefix == '$') {
          setCurrentWhitelist(variables?.map(({ name }) => name) || [])
        }

        if (prefix == '{{') {
          // TODO refactor to use the schema format properly and allow to breakdown into an object type search
          setCurrentWhitelist(Object.keys(events))
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
    }
  }

  const addPrefix = prefix => {
    if (!tagifyRef.current?.DOM.input.innerHTML.endsWith('&nbsp;')) {
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
          whitelist: currentWhitelist,
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
              return `<tag title="${tagData}"
                contenteditable="false"
                spellcheck="false"
                readonly
                tabIndex="-1"
                class="tagify__tag">
                <div>
                  ${ReactDOMServer.renderToStaticMarkup(
                    <Icon icon={data.prefix === '$' ? 'dollar' : <Icons.Brackets iconSize={10} />} iconSize={10} />
                  )}
                  <span class="tagify__tag-text">${tagData}</span>
                </div>
              </tag>`
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
