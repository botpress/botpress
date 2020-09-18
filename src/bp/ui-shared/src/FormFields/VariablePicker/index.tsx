import { Button, Classes, Icon, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import cx from 'classnames'
import { FC, useEffect, useState } from 'react'
import React from 'react'
import { FieldProps } from '~/Contents/Components/typings'

import sharedStyle from '../../style.scss'
import { lang } from '../../translations'

import style from './style.scss'
import { VariablePickerProps } from './typings'

// TODO: Visibility Filter: Input, Output, Both
type Props = FieldProps & VariablePickerProps

interface Option {
  label: string
  value: string
  icon?: string
}

const itemRenderer = (option, { modifiers, handleClick }) => {
  const isAdding = option.type === 'add'

  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled || option.disabled}
      key={option.label || option}
      onClick={handleClick}
      icon={isAdding ? <Icon icon="plus" iconSize={12} /> : <Icon icon={option.icon} iconSize={10} />}
      text={isAdding ? `${lang('create')} "${option.label}"` : option.label || option}
    />
  )
}

const VariablePicker: FC<Props> = ({
  onChange,
  children,
  data,
  placeholder,
  className,
  field,
  variables,
  addVariable,
  defaultVariableType,
  variableTypes,
  variableSubType
}) => {
  const [options, setOptions] = useState<Option[]>([])
  const [activeItem, setActiveItem] = useState<Option | undefined>()

  const SimpleDropdown = Select.ofType<Option>()

  const getCurrentOption = () => {
    const value = data[field.key] || field.defaultValue || (!placeholder && options?.[0]?.value)
    return options?.find(option => option.value === value)
  }

  useEffect(() => {
    const vars = variables.currentFlow
      ?.filter(x => variableTypes?.includes(x.type) && (!variableSubType || variableSubType === x.params?.subType))
      .map(({ type, params: { name } }) => ({
        label: name,
        value: name,
        icon: variables.primitive.find(x => x.id === type)?.config?.icon
      }))

    setOptions(vars ?? [])
  }, [variables, variableTypes])

  useEffect(() => {
    const currentOption = getCurrentOption()
    setActiveItem(options?.find(item => item.value === currentOption?.value) ?? currentOption)
  }, [options])

  const filterDropdown = (query: string, options) => {
    const addOption = [] as any[]

    const newVarName = query?.replace(/[^A-Z_0-9-]/gi, '')
    const canCreate =
      newVarName?.length &&
      !variables?.currentFlow?.find(x => x.params?.name?.toLowerCase() === newVarName.toLowerCase()) &&
      !options?.find(x => query.toLowerCase() === x.label.toLowerCase() || query.toLowerCase() === x.value)

    if (canCreate) {
      addOption.push({
        label: newVarName,
        type: 'add',
        value: newVarName
      })
    }

    return [
      ...addOption,
      ...options.filter(x => `${x.label.toLowerCase()} ${x.value}`.indexOf(query.toLowerCase()) > -1)
    ]
  }

  const onAddVariable = (value, list) => {
    const isAdding = !list.includes(value)

    if (isAdding) {
      const newVariable = {
        type: defaultVariableType || 'string',
        params: {
          name: value,
          subType: variableSubType
        }
      }

      addVariable?.(newVariable)
    }
  }

  const updateSelectedOption = option => {
    onAddVariable(option.value, variables?.currentFlow?.map(x => x.params?.name) ?? [])
    onChange?.(option.value)
  }

  let btnText = activeItem ? activeItem.value : placeholder
  if (getCurrentOption()) {
    btnText = getCurrentOption()?.label
  }

  return (
    <SimpleDropdown
      filterable
      className={cx(sharedStyle.formSelect, className)}
      inputProps={{ placeholder: lang('filter') }}
      items={options}
      activeItem={activeItem}
      resetOnQuery={false}
      popoverProps={{ minimal: true, usePortal: false }}
      itemRenderer={itemRenderer}
      itemListPredicate={filterDropdown}
      onItemSelect={option => updateSelectedOption(option)}
    >
      {children || (
        <Button
          className={cx(style.btn, { [style.placeholder]: !activeItem })}
          text={btnText}
          rightIcon={'chevron-down'}
        />
      )}
    </SimpleDropdown>
  )
}

export default VariablePicker
