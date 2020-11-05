import React from 'react'
import { FC } from 'react'

import Form from '.'
import { SingleControlProps } from './typings'

const SingleControl: FC<SingleControlProps> = ({
  control,
  value,
  onChange,
  defaultLang,
  currentLang,
  mediaPath,
  overrideFields,
  fieldError,
  events
}) => {
  const FAKE_FIELD = 'field_name'
  return (
    <Form.Form
      defaultLang={defaultLang}
      currentLang={currentLang}
      mediaPath={mediaPath}
      overrideFields={overrideFields}
      events={events}
      fields={{ [FAKE_FIELD]: control }}
      formData={{ [FAKE_FIELD]: value }}
      fieldsError={fieldError ? { [FAKE_FIELD]: fieldError } : undefined}
      onUpdate={newData => onChange(newData[FAKE_FIELD])}
    />
  )
}

export default SingleControl
