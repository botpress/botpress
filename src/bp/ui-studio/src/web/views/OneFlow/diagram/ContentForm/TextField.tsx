import { FormData } from 'botpress/sdk'
import { FormFields, lang } from 'botpress/shared'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  field: any
  data: any
  label: string
  onChange: (value: FormData) => void
}

const TextAreaList: FC<Props> = props => {
  const { label, onChange, field, data } = props
  const [forceUpdateHeight, setForceUpdateHeight] = useState(false)

  useEffect(() => {
    if (data.text) {
      setForceUpdateHeight(!forceUpdateHeight)
    }
  }, [data.text])

  const handleChange = items => {
    const firstItem = items.shift()
    onChange({ text: firstItem, variations: items })
  }

  return (
    <FormFields.TextFieldsArray
      key={`${field.key}${forceUpdateHeight}`}
      label={label}
      items={[data.text, ...(data.variations || [])]}
      onChange={handleChange}
      addBtnLabel={lang.tr('module.builtin.types.text.add')}
      getPlaceholder={index => (index === 0 ? lang.tr('module.builtin.types.actionButton.sayPlaceholder') : '')}
    />
  )
}

export default TextAreaList
