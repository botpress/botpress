import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import axios from 'axios'
import { ConditionListOptions, Option } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  selectedValue?: string
  defaultValue?: string
  listOptions: ConditionListOptions
  onChange: (item: any) => void
}

const SelectDropdown = Select.ofType<Option>()

const Dropdown: FC<Props> = props => {
  const [elements, setElements] = useState([])
  const [selected, setSelected] = useState<Option>()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadListElements()
  }, [])

  useEffect(() => {
    selectDefaultElement()
  }, [elements])

  const loadListElements = async () => {
    const { endpoint, path, valueField, labelField, items } = props.listOptions

    if (items) {
      return setElements(items)
    }

    if (!endpoint) {
      return
    }

    try {
      const { data } = await axios.get(
        endpoint.replace('BOT_API_PATH', window.BOT_API_PATH).replace('API_PATH', window.API_PATH)
      )
      const elements = path ? _.get(data, path) : data

      setElements(elements.map(x => ({ label: x[labelField || 'label'], value: x[valueField || 'value'] })))
    } catch (err) {
      console.error(err)
    }
  }

  const selectDefaultElement = () => {
    if (!elements || !elements.length) {
      return
    }
    const chosenValue = elements.find(x => x.value === props.selectedValue)
    const defaultValue = elements.find(x => x.value === props.defaultValue)

    setSelected(chosenValue || defaultValue || elements[0])
  }

  const selectItem = item => {
    if (item !== selected) {
      setSelected(item)
      props.onChange(item)
    }
  }

  return (
    <SelectDropdown
      items={elements}
      itemPredicate={filterOptions}
      itemRenderer={renderOption}
      activeItem={selected}
      popoverProps={{ minimal: true }}
      noResults={<MenuItem disabled={true} text={lang.tr('studio.flow.condition.noResults')} />}
      onItemSelect={option => selectItem(option)}
      onActiveItemChange={option => selectItem(option)}
    >
      <Button
        id="select"
        text={(selected && selected.label) || lang.tr('studio.flow.condition.chooseElement')}
        rightIcon="double-caret-vertical"
      />
    </SelectDropdown>
  )
}

const filterOptions: ItemPredicate<Option> = (query, option) => {
  return `${option.label.toLowerCase()} ${option.value}`.indexOf(query.toLowerCase()) > -1
}

const renderOption: ItemRenderer<Option> = (option, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.value}
      onClick={handleClick}
      text={option.label}
    />
  )
}

export default Dropdown
