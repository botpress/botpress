import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import { Condition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'

interface OwnProps {
  onChange: (item: Condition) => void
  ignored?: Condition[]
}

interface StateProps {
  conditions: Condition[]
}

type Props = StateProps & OwnProps

const SelectDropdown = Select.ofType<Condition>()

const ConditionDropdown: FC<Props> = props => {
  const [selected, setSelected] = useState<Condition>()
  const [elements, setElements] = useState([])

  if (!props.conditions || !props.conditions.length) {
    return null
  }

  useEffect(() => {
    const ignoredIds = (props.ignored && props.ignored.map(x => x.id)) || []
    const elements = props.conditions.filter(x => !ignoredIds.includes(x.id))

    setElements(elements)
    selectItem(elements[0])
  }, [props.ignored])

  const selectItem = (item: Condition) => {
    setSelected(item)
    props.onChange(item)
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
        id="select-role"
        text={(selected && selected.label) || lang.tr('studio.flow.condition.selectCondition')}
        rightIcon="double-caret-vertical"
      />
    </SelectDropdown>
  )
}

const filterOptions: ItemPredicate<Condition> = (query, option) => {
  return `${option.label.toLowerCase()} ${option.id}`.indexOf(query.toLowerCase()) > -1
}

const renderOption: ItemRenderer<Condition> = (option, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.id}
      onClick={handleClick}
      text={option.label}
    />
  )
}

const mapStateToProps = state => ({ conditions: state.ndu.conditions })

export default connect<StateProps, undefined, OwnProps>(mapStateToProps, undefined)(ConditionDropdown)
