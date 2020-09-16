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
  defaultLang: string
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
  defaultLang
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

  const getRefLang = (value, variations, currentLang, defaultLang) => {
    const combinedValues = Object.keys(value).reduce(
      (acc, key) => ({ ...acc, [key]: [value?.[key] || '', ...(variations[key] || [])].filter(Boolean) }),
      {}
    )
    const currentLangValues = combinedValues[currentLang]
    let currentHighest = 0
    let refLang
    Object.keys(combinedValues)
      .filter(l => l !== currentLang)
      .forEach(key => {
        const thisLength = combinedValues[key].length
        if (thisLength > currentHighest) {
          refLang = key
          currentHighest = thisLength
        }
      })

    if (currentLangValues?.length || 0 < currentHighest) {
      return refLang
    }
  }

  const refLang = getRefLang(data.text || {}, data.variations || {}, currentLang, defaultLang)

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
