import { FormData } from 'botpress/sdk'
import { FormFields, lang } from 'botpress/shared'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  field: any
  data: any
  label: string
  onChange: (value: FormData) => void
  currentLang
}

const TextAreaList: FC<Props> = ({ label, onChange, field, data, currentLang }) => {
  const [forceUpdateHeight, setForceUpdateHeight] = useState(false)

  useEffect(() => {
    if (data.text) {
      setForceUpdateHeight(!forceUpdateHeight)
    }
  }, [data.text])

  const handleChange = items => {
    const firstItem = items.shift()

    onChange({
      text: { ...data.text, [currentLang]: firstItem },
      variations: { ...data.variations, [currentLang]: items }
    })
  }

  return (
    <FormFields.TextFieldsArray
      key={`${field.key}${forceUpdateHeight}`}
      label={label}
      items={[...([data.text?.[currentLang]] || []), ...(data.variations?.[currentLang] || [])]}
      onChange={handleChange}
      addBtnLabel={lang.tr('module.builtin.types.text.add')}
      getPlaceholder={index => (index === 0 ? lang.tr('module.builtin.types.actionButton.sayPlaceholder') : '')}
    />
  )
}

export default TextAreaList
