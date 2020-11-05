import cx from 'classnames'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { Control, ControlType } from '~/../../common/controls'

import sharedStyle from '../../../../ui-shared-lite/style.scss'
import { lang } from '../../translations'
import { getFieldDefaultValue } from '../utils/fields'

import { FieldProps } from './typings'

type TextProps = FieldProps & { field: Control }

const Text: FC<TextProps> = ({ onBlur, onChange, placeholder, field, value, refValue, childRef }) => {
  const { type, defaultValue, required } = field
  const [localValue, setLocalValue] = useState(value || getFieldDefaultValue(field))

  const missingTranslation = refValue && !value

  useEffect(() => {
    setLocalValue(value ?? getFieldDefaultValue(field))
  }, [value])

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  const reformatValue = value => {
    if (field.type === ControlType.String && field.valueManipulation) {
      const { regex, modifier, replaceChar } = field.valueManipulation
      const re = new RegExp(regex, modifier)

      value = value.replace(re, replaceChar)
    }

    if (field.type === ControlType.Number) {
      const { min, max } = field
      if (max !== undefined && Number(value) > max) {
        value = `${max}`
      }

      if (min !== undefined && Number(value) < min) {
        value = `${min}`
      }
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
        maxLength={(field.type === ControlType.String && field.maxLength) || undefined}
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
