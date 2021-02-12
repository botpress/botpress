import { FormField } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC, Fragment, useEffect, useState } from 'react'

import sharedStyle from '../../../../ui-shared-lite/style.scss'
import { lang } from '../../translations'
import { getFieldDefaultValue } from '../utils/fields'

import { TextProps } from './typings'

const Text: FC<TextProps> = ({
  onBlur,
  onChange,
  placeholder,
  field: { valueManipulation, type, min, max, maxLength, defaultValue, required },
  value,
  refValue,
  childRef
}) => {
  const [localValue, setLocalValue] = useState(value || getFieldDefaultValue({ type, defaultValue }))

  const missingTranslation = refValue && !value

  useEffect(() => {
    setLocalValue(value ?? getFieldDefaultValue({ type, defaultValue }))
  }, [value])

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  const reformatValue = value => {
    if (valueManipulation) {
      const { regex, modifier, replaceChar } = valueManipulation
      const re = new RegExp(regex, modifier)

      value = value.replace(re, replaceChar)
    }

    if (max !== undefined && Number(value) > max) {
      value = `${max}`
    }

    if (min !== undefined && Number(value) < min) {
      value = `${min}`
    }

    return value
  }

  const beforeOnBlur = () => {
    if (!localValue && required) {
      setLocalValue(defaultValue)
      onBlur?.(defaultValue)
      return
    }
    onBlur?.(localValue)
  }

  return (
    <Fragment>
      <input
        ref={ref => childRef?.(ref)}
        className={cx(sharedStyle.input, { 'has-error': missingTranslation })}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onChange={e => {
          const value = reformatValue(e.target.value)

          onChange?.(value)
          setLocalValue(value)
        }}
        onBlur={beforeOnBlur}
        value={localValue ?? refValue}
      />
      {missingTranslation && <span className={sharedStyle.fieldError}>{lang('pleaseTranslateField')}</span>}
    </Fragment>
  )
}

export default Text
