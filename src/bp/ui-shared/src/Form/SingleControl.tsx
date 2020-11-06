import React from 'react'
import { FC } from 'react'

import Form from '.'
import { SingleControlProps } from './typings'

const SingleControl: FC<SingleControlProps> = props => {
  const TEMP_FIELD = 'field'
  const { control, value, fieldError, onChange } = props

  return (
    <Form.Form
      {...props}
      fields={{ [TEMP_FIELD]: control }}
      formData={{ [TEMP_FIELD]: value }}
      fieldsError={fieldError ? { [TEMP_FIELD]: fieldError } : undefined}
      onUpdate={newData => onChange(newData[TEMP_FIELD])}
    />
  )
}

export default SingleControl
