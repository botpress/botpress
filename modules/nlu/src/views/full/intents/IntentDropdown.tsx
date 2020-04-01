import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  intents?: NLU.IntentDefinition[]
  currentIntent?: string
  onChange?: (item: NLU.IntentDefinition) => void
}

const SelectDropdown = Select.ofType<NLU.IntentDefinition>()
const noIntent: any = { name: lang.tr('nlu.intents.selectIntentLabel') }

const IntentDropdown: FC<Props> = props => {
  const [selected, setSelected] = useState<NLU.IntentDefinition>()

  useEffect(() => {
    if (props.intents && props.currentIntent) {
      setSelected(props.intents.find(x => x.name === props.currentIntent))
    }
  }, [props.intents])

  const selectItem = (item: NLU.IntentDefinition) => {
    if (item !== noIntent && item !== selected) {
      setSelected(item)
      props.onChange && props.onChange(item)
    }
  }

  return (
    <SelectDropdown
      items={[noIntent, ...props.intents]}
      itemPredicate={filterOptions}
      itemRenderer={renderOption}
      activeItem={selected}
      popoverProps={{ minimal: true }}
      noResults={<MenuItem disabled={true} text={lang.tr('nlu.intents.selectIntentNoResults')} />}
      onItemSelect={option => selectItem(option)}
      onActiveItemChange={option => selectItem(option)}
    >
      <Button
        id="select-intent"
        text={(selected && selected.name) || noIntent.name}
        rightIcon="double-caret-vertical"
      />
    </SelectDropdown>
  )
}

const filterOptions: ItemPredicate<NLU.IntentDefinition> = (query, option) => {
  return `${option.name.toLowerCase()} `.indexOf(query.toLowerCase()) > -1
}

const renderOption: ItemRenderer<NLU.IntentDefinition> = (option, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.name}
      onClick={handleClick}
      text={option.name}
    />
  )
}

export default IntentDropdown
