import React, { FC } from 'react'

import Dropdown from '../../../Dropdown'
import style from '../style.scss'
import { FieldProps } from '../typings'

interface SelectProps extends FieldProps {
  options: { value: string; label: string }[]
}

const Select: FC<SelectProps> = ({ onChange, options, value }) => (
  <Dropdown
    filterable={false}
    className={style.formSelect}
    items={options}
    defaultItem={value}
    rightIcon="chevron-down"
    onChange={option => onChange?.(option.value)}
  />
)

export default Select
