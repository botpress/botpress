import { FormField } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC, Fragment, useEffect, useState } from 'react'

import sharedStyle from '../../../../ui-shared-lite/style.scss'
import Textarea from '../../Textarea'
import { lang } from '../../translations'

import { FieldProps } from './typings'

type TextAreaProps = FieldProps & { field: FormField }

const TextArea: FC<TextAreaProps> = ({
  onBlur,
  onChange,
  placeholder,
  field: { valueManipulation },
  refValue,
  value
}) => {
  const [localValue, setLocalValue] = useState(value || '')
  const missingTranslation = refValue && !value

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  return (
    <Fragment>
      <Textarea
        className={cx(sharedStyle.input, { [sharedStyle.hasError]: missingTranslation })}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onChange={value => {
          if (valueManipulation) {
            const { regex, modifier, replaceChar } = valueManipulation
            const re = new RegExp(regex, modifier)

            value = value.replace(re, replaceChar)
          }

          onChange?.(value)
          setLocalValue(value)
        }}
        onBlur={() => onBlur?.(localValue)}
        value={localValue || refValue || ''}
      />
      {missingTranslation && <span className={sharedStyle.fieldError}>{lang('pleaseTranslateField')}</span>}
    </Fragment>
  )
}

export default TextArea
