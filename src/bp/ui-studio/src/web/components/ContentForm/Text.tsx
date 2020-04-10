import React, { FC, useEffect, useState } from 'react'
import SmartInput from '~/components/SmartInput'
import style from '~/views/OneFlow/sidePanel/form/style.scss'

interface Props {
  formData: any
  schema: any
  required?: boolean
  uiSchema: any
  onChange: () => any
}

const Text: FC<Props> = props => {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(props.formData)
  }, [props.formData])

  return (
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
    </div>
  )
}

export default Text
