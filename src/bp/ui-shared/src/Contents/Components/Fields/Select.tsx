import { FormData, FormOption, FormField, FormDynamicOptions } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import { lang } from '../../../translations'
import Dropdown from '../../../Dropdown'
import style from '../style.scss'
import { FieldProps } from '../typings'

interface SelectProps extends FieldProps {
  data: FormData
  field: FormField
  bp?: any
  parent?
  printField?
}

const Select: FC<SelectProps> = ({ onChange, printField, parent, field, data, bp }) => {
  const [options, setOptions] = useState<FormOption[]>([])

  useEffect(() => {
    if (field.dynamicOptions) {
      // tslint:disable-next-line: no-floating-promises
      loadListElements()
    } else {
      setOptions(field.options as FormOption[])
    }
  }, [])

  const loadListElements = async () => {
    const { endpoint, path, valueField, labelField } = field.dynamicOptions as FormDynamicOptions

    try {
      const { data } = await bp.axios.get(
        endpoint.replace('BOT_API_PATH', window.BOT_API_PATH).replace('API_PATH', window.API_PATH)
      )
      const elements = path ? _.get(data, path) : data

      setOptions(elements.map(x => ({ label: x[labelField || 'label'], value: x[valueField || 'value'] })))
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const value = (data[field.key] || field.defaultValue || options?.[0]?.value) as string
  const currentOption = options?.find(option => option.value === value)

  return (
    <Fragment>
      <Dropdown
        filterable={false}
        className={style.formSelect}
        items={options?.map(option => ({ ...option, label: lang(option.label) }))}
        defaultItem={value}
        rightIcon="chevron-down"
        onChange={option => onChange?.(option.value)}
      />
      {currentOption?.related && printField(currentOption.related, data, parent)}
    </Fragment>
  )
}

export default Select
