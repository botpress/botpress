import Tags from '@yaireo/tagify/dist/react.tagify'
import React, { useState } from 'react'

import style from './style.scss'

export default props => {
  const [currentWhitelist, setCurrentWhitelist] = useState<string[]>([])

  const tagifyCallbacks = {
    input: e => {
      const prefix = e.detail.prefix
      if (prefix) {
        if (prefix == '$') {
          setCurrentWhitelist(['variable', 'variable1', 'variable2', 'variable3', 'variable4'])
        }

        if (prefix == '{{') {
          setCurrentWhitelist(['event', 'event1', 'event2', 'event3', 'event4'])
        }

        if (e.detail.value.length > 1) {
          e.detail.tagify.dropdown.show.call(e.detail.tagify, e.detail.value)
        }
      }
    }
  }

  const TAGS_REGEX = /\[\[(.*?)\]\]/gim
  const VARIABLES_REGEX = /(\$[^\s]+)/gim
  const EVENT_REGEX = /\{\{(.*?)\}\}/gim

  const convertToString = (value: string): string => {
    let matches: any
    let newString = value

    while ((matches = TAGS_REGEX.exec(value)) !== null) {
      const data = JSON.parse(matches[1])
      let suffix = ''

      if (data.prefix === '{{') {
        suffix = '}}'
      }

      const newValue = `${data.prefix}${data.value}${suffix}`

      newString = newString.replace(matches[0], newValue)
    }

    return newString
  }

  const convertToTags = (value: string): string => {
    let matches: any
    let newString = value

    while ((matches = VARIABLES_REGEX.exec(value)) !== null) {
      newString = newString.replace(matches[0], `[[{"value": "${matches[0].replace('$', '')}", "prefix": "$$"}]]`)
    }

    while ((matches = EVENT_REGEX.exec(value)) !== null) {
      newString = newString.replace(matches[0], `[[{"value": "${matches[1]}", "prefix": "{{"}]]`)
    }

    return newString
  }

  return (
    <Tags
      className={style.superInput}
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
        callbacks: tagifyCallbacks,
        mode: 'mix',
        pattern: /\$|{{/
      }}
      value={convertToTags(props.value)}
      onChange={e => (e.persist(), props.onBlur(convertToString(e.target.value)))}
    />
  )
}
