import { BotEvent, FlowVariable, FormData } from 'botpress/sdk'
import { FormFields, lang } from 'botpress/shared'
import { Variables } from 'common/typings'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  field: any
  data: any
  label: string
  onChange: (value: FormData) => void
  onUpdateVariables?: (variable: FlowVariable) => void
  variables?: Variables
  events?: BotEvent[]
  currentLang: string
  defaultLanguage: string
}

const TextAreaList: FC<Props> = ({
  label,
  onChange,
  field,
  data,
  variables,
  events,
  onUpdateVariables,
  currentLang,
  defaultLanguage
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

  const getRefLang = (value, currentLang, defaultLanguage) => {
    if (currentLang !== defaultLanguage || !value[defaultLanguage]) {
      return Object.keys(value).find(key => key !== currentLang && value[key])
    }

    return defaultLanguage
  }

  const refLang = getRefLang(data.text || {}, currentLang, defaultLanguage)

  return (
    <FormFields.SuperInputArray
      variables={variables}
      refValue={[...[data.text?.[refLang] || ''], ...(data.variations?.[refLang] || [])]}
      events={events || []}
      onUpdateVariables={onUpdateVariables}
      label={label}
      items={[...[data.text?.[currentLang] || ''], ...(data.variations?.[currentLang] || [])]}
      onChange={handleChange}
      addBtnLabel={lang.tr('module.builtin.types.text.add')}
      getPlaceholder={index => lang.tr('module.builtin.types.actionButton.sayPlaceholder')}
    />
  )
}

export default TextAreaList
