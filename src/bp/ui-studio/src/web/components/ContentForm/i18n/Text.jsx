import React, { useEffect, useState } from 'react'
import SmartInput from '~/components/SmartInput'

import { renderWrapped } from './I18nManagerFunctional'
import style from '../style.scss'

const Text = props => {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(props.formData)
  }, [props.formData])

  return renderWrapped(
    <div className={style.fieldWrapper}>
      <span className={style.formLabel}>
        {props.schema.title} {props.required && '*'}
      </span>
      <div className={style.innerWrapper}>
        <SmartInput
          singleLine={props.uiSchema.$subtype !== 'textarea'}
          value={value}
          onChange={props.onChange}
          className={style.textarea}
          isSideForm
        />
      </div>
    </div>,
    props
  )
}

export default Text
