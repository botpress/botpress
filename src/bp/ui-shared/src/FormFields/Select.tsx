import { FormData, FormDynamicOptions, FormField, FormOption } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import { lang } from '../translations'
import style from '../Contents/Components/style.scss'
import { FieldProps } from '../Contents/Components/typings'
import Dropdown from '../Dropdown'

interface SelectProps extends FieldProps {
  data: FormData
  field: FormField
  axios?: any
  parent?
  printField?
}

const Select: FC<SelectProps> = ({ onChange, printField, parent, field, data, axios }) => {
  const [options, setOptions] = useState<FormOption[]>([])

  useEffect(() => {
    if (field.dynamicOptions) {
      // tslint:disable-next-line: no-floating-promises
      loadListElements()
    } else {
      setOptions(field.options!)
    }
  }, [])

  const loadListElements = async () => {
    const { endpoint, path, valueField, labelField } = field.dynamicOptions!

    try {
      const { data } = await axios.get(
        endpoint.replace('BOT_API_PATH', window.BOT_API_PATH).replace('API_PATH', window.API_PATH)
      )
      const elements = path ? _.get(data, path) : data

      setOptions(elements.map(x => ({ label: x[labelField || 'label'], value: x[valueField || 'value'] })))
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const value = data[field.key] || field.defaultValue || (!field.placeholder && options?.[0]?.value)
  const currentOption = options?.find(option => option.value === value)

  return (
    <Fragment>
      <Dropdown
        filterable={false}
        className={style.formSelect}
        placeholder={field.placeholder && lang(field.placeholder as string)}
        items={options?.map(option => ({ ...option, label: lang(option.label) }))}
        defaultItem={currentOption && { ...currentOption, label: lang(currentOption.label) }}
        rightIcon="chevron-down"
        onChange={option => onChange?.(option.value)}
      />
      {currentOption?.related && printField(currentOption.related, data, parent)}
    </Fragment>
  )
}

export default Select
