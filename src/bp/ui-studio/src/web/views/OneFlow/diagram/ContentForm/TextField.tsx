import { BotEvent, FlowVariable, FormData } from 'botpress/sdk'
import { FormFields, lang } from 'botpress/shared'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  field: any
  data: any
  label: string
  onChange: (value: FormData) => void
  onUpdateVariables?: (variable: FlowVariable) => void
  variables?: FlowVariable[]
  events?: BotEvent[]
  currentLang
}

const TextAreaList: FC<Props> = ({
  label,
  onChange,
  field,
  data,
  variables,
  events,
  onUpdateVariables,
  currentLang
}) => {
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
    <FormFields.SuperInputArray
      variables={variables || []}
      events={events || []}
      onUpdateVariables={onUpdateVariables}
      label={label}
      items={[...([data.text?.[currentLang]] || []), ...(data.variations?.[currentLang] || [])]}
      onChange={handleChange}
      addBtnLabel={lang.tr('module.builtin.types.text.add')}
      getPlaceholder={index => (index === 0 ? lang.tr('module.builtin.types.actionButton.sayPlaceholder') : '')}
    />
  )
}

export default TextAreaList
