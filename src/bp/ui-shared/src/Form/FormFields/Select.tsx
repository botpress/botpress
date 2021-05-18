import { FormOption } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import sharedStyle from '../../../../ui-shared-lite/style.scss'
import Dropdown from '../../Dropdown'
import { lang } from '../../translations'

import { SelectProps } from './typings'

const Select: FC<SelectProps> = ({ onChange, printField, parent, field, data, axios }) => {
  const [options, setOptions] = useState<FormOption[]>([])

  useEffect(() => {
    if (field.dynamicOptions) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadListElements()
    } else {
      setOptions(field.options!)
    }
  }, [])

  useEffect(() => {
    setOptions(field.options!)
  }, [field.options])

  const loadListElements = async () => {
    const { endpoint, path, valueField, labelField } = field.dynamicOptions!

    try {
      const { data } = await axios.get(
        endpoint
          .replace('BOT_API_PATH', window.BOT_API_PATH)
          .replace('STUDIO_API_PATH', window.STUDIO_API_PATH)
          .replace('API_PATH', window.API_PATH)
      )
      const elements = path ? _.get(data, path) : data

      setOptions(elements.map(x => ({ label: x[labelField || 'label'], value: x[valueField || 'value'] })))
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const value = data[field.key] ?? field.defaultValue ?? (!field.placeholder && options?.[0]?.value)
  const currentOption = options?.find(option => option.value === value)

  return (
    <Fragment>
      <Dropdown
        filterable={false}
        className={sharedStyle.formSelect}
        placeholder={field.placeholder && lang(field.placeholder as string)}
        items={options?.map(option => ({ ...option, label: lang(option.label) })) || []}
        defaultItem={currentOption && { ...currentOption, label: lang(currentOption.label) }}
        rightIcon="chevron-down"
        onChange={option => onChange?.(option.value)}
      />
      {currentOption?.related && printField(currentOption.related, data, parent)}
    </Fragment>
  )
}

export default Select
