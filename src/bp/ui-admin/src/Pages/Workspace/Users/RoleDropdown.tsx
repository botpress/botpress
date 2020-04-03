import { Button, Classes, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import { lang } from 'botpress/shared'
import { AuthRole } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'

import { fetchRoles } from '../../../reducers/roles'

interface OwnProps {
  defaultRole?: string
  onChange: (role: AuthRole) => void
}

interface DispatchProps {
  fetchRoles: () => void
}

interface StateProps {
  roles: AuthRole[]
}

type Props = DispatchProps & StateProps & OwnProps

const SelectDropdown = Select.ofType<AuthRole>()

const RoleDropdown: FC<Props> = props => {
  const [selected, setSelected] = useState<AuthRole>()

  useEffect(() => {
    if (!props.roles || !props.roles.length) {
      props.fetchRoles()
    } else {
      const defaultRole = props.defaultRole && props.roles.find(x => x.id === props.defaultRole)
      selectOption(defaultRole || props.roles[0])
    }
  }, [props.roles])

  const selectOption = item => {
    if (item) {
      setSelected(item)
      props.onChange(item)
    }
  }

  if (!props.roles || !selected) {
    return null
  }

  return (
    <SelectDropdown
      items={props.roles}
      itemPredicate={filterOptions}
      itemRenderer={renderOption}
      activeItem={selected}
      popoverProps={{ minimal: true }}
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={option => selectOption(option)}
      onActiveItemChange={option => selectOption(option)}
    >
      <Button id="select-role" text={lang.tr(selected.name)} rightIcon="double-caret-vertical" />
    </SelectDropdown>
  )
}

const filterOptions: ItemPredicate<AuthRole> = (query, option) => {
  return `${option.name.toLowerCase()} ${option.id}`.indexOf(query.toLowerCase()) > -1
}

const renderOption: ItemRenderer<AuthRole> = (option, { handleClick, modifiers }) => {
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
      text={lang.tr(option.name)}
    />
  )
}

const mapStateToProps = state => ({ roles: state.roles.roles })

export default connect<StateProps, DispatchProps>(mapStateToProps, { fetchRoles })(RoleDropdown)
