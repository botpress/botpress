import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import { AuthStrategyConfig } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { AppState } from '~/app/reducer'

import { fetchAuthConfig } from '~/auth/reducer'

interface OwnProps {
  onChange: (strategy: AuthStrategyConfig) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps

const SelectDropdown = Select.ofType<AuthStrategyConfig>()

const AuthStrategyDropdown: FC<Props> = props => {
  const [selected, setSelected] = useState<AuthStrategyConfig>()

  useEffect(() => {
    if (!props.authConfig) {
      props.fetchAuthConfig()
    } else if (props.authConfig.length) {
      selectOption(props.authConfig[0])
    }
  }, [props.authConfig])

  const selectOption = item => {
    if (item) {
      setSelected(item)
      props.onChange(item)
    }
  }

  if (!props.authConfig || !selected) {
    return null
  }

  return (
    <SelectDropdown
      items={props.authConfig}
      itemPredicate={filterOptions}
      itemRenderer={renderOption}
      activeItem={selected}
      popoverProps={{ minimal: true }}
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={option => selectOption(option)}
      onActiveItemChange={option => selectOption(option)}
    >
      <Button text={selected.label || selected.strategyId} rightIcon="double-caret-vertical" />
    </SelectDropdown>
  )
}

const filterOptions: ItemPredicate<AuthStrategyConfig> = (query, option) => {
  const label = option.label && option.label.toLowerCase()
  return `${label} ${option.strategyId}`.indexOf(query.toLowerCase()) > -1
}

const renderOption: ItemRenderer<AuthStrategyConfig> = (option, { handleClick, modifiers }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.strategyId}
      onClick={handleClick}
      text={option.label || option.strategyId}
    />
  )
}

const mapStateToProps = (state: AppState) => ({
  authConfig: state.auth.authConfig
})

const mapDispatchToProps: any = { fetchAuthConfig }

export default connect<StateProps, DispatchProps, OwnProps, AppState>(
  mapStateToProps,
  mapDispatchToProps
)(AuthStrategyDropdown)
