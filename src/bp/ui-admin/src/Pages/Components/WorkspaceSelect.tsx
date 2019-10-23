import { Classes, Icon, MenuItem } from '@blueprintjs/core'
import { ItemPredicate, ItemRenderer, Select } from '@blueprintjs/select'
import { WorkspaceUser } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import { isOperationAllowed } from '~/App/AccessControl'
import { getActiveWorkspace } from '~/Auth'

import { fetchBots } from '../../reducers/bots'
import { fetchRoles } from '../../reducers/roles'
import { fetchMyWorkspaces, fetchUsers, switchWorkspace } from '../../reducers/user'

interface DispatchProps {
  fetchMyWorkspaces: () => void
  switchWorkspace: (workspaceId: string) => void
  fetchUsers: () => void
  fetchBots: () => void
  fetchRoles: () => void
}

interface StateProps {
  workspaces?: WorkspaceUser[]
  currentWorkspace?: string
}

type Props = DispatchProps & StateProps & RouteComponentProps<{ workspaceId: string }>

const SelectDropdown = Select.ofType<WorkspaceUser>()

const WorkspaceSelect: FC<Props> = props => {
  const urlWorkspaceId = props.match.params.workspaceId
  const [options, setOptions] = useState<WorkspaceUser[]>()
  const [selected, setSelected] = useState<WorkspaceUser>()

  useEffect(() => {
    if (!props.workspaces) {
      props.fetchMyWorkspaces()
    } else {
      checkWorkspaceId()
      refreshOptions()
    }
  }, [props.workspaces, urlWorkspaceId])

  useEffect(() => {
    if (!props.currentWorkspace) {
      return
    }

    if (isOperationAllowed({ operation: 'read', resource: 'admin.collaborators' })) {
      props.fetchUsers()
    }

    if (isOperationAllowed({ operation: 'read', resource: 'admin.roles' })) {
      props.fetchRoles()
    }

    props.fetchBots()
  }, [props.currentWorkspace])

  const getValidWorkspaceId = () => {
    if (!props.workspaces || !props.workspaces.length) {
      return
    }

    const urlId = props.workspaces.find(x => x.workspace == urlWorkspaceId)
    const storageId = props.workspaces.find(x => x.workspace == getActiveWorkspace())
    return (urlId && urlId.workspace) || (storageId && storageId.workspace) || props.workspaces[0].workspace
  }

  const refreshOptions = () => {
    const workspaces = props.workspaces!
    setOptions(workspaces)
    setSelected(workspaces.find(x => x.workspace === getActiveWorkspace()))
  }

  const checkWorkspaceId = () => {
    const workspaceId = getValidWorkspaceId()

    if (!workspaceId) {
      return props.history.replace('/noAccess')
    }

    if (workspaceId !== getActiveWorkspace()) {
      props.switchWorkspace(workspaceId)
      setUrlWorkspaceId(workspaceId)
    }

    // Invalid workspace id in  url, needs to be updated
    if (workspaceId !== urlWorkspaceId) {
      setUrlWorkspaceId(workspaceId)
    }
  }

  const setUrlWorkspaceId = workspaceId => {
    const workspacePath = generatePath(props.match.path, { workspaceId })
    const currentPage = props.location.pathname.replace(props.match.url, '')

    props.history.push(workspacePath + currentPage)
  }

  if (!props.workspaces || !options || !selected) {
    return null
  }

  if (props.workspaces.length === 1) {
    return <span>Workspace {props.workspaces[0].workspaceName}</span>
  }

  return (
    <SelectDropdown
      items={options}
      itemPredicate={filterOptions}
      itemRenderer={renderOption}
      activeItem={selected}
      popoverProps={{ minimal: true }}
      noResults={<MenuItem disabled={true} text="No results." />}
      onItemSelect={option => setUrlWorkspaceId(option.workspace)}
    >
      <div style={{ cursor: 'pointer' }}>
        Workspace {selected.workspaceName} <Icon icon="caret-down" />
      </div>
    </SelectDropdown>
  )
}

const filterOptions: ItemPredicate<WorkspaceUser> = (query, option, _index) => {
  const normalizedLabel = option.workspaceName!.toLowerCase()
  const normalizedQuery = query.toLowerCase()

  return `${normalizedLabel} ${option.workspace}`.indexOf(normalizedQuery) >= 0
}

const renderOption: ItemRenderer<WorkspaceUser> = (option, { handleClick, modifiers, query }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.workspaceName}
      onClick={handleClick}
      text={option.workspaceName}
    />
  )
}

const mapStateToProps = state => ({
  workspaces: state.user.workspaces,
  currentWorkspace: state.user.currentWorkspace
})

const mapDispatchToProps = { fetchMyWorkspaces, switchWorkspace, fetchUsers, fetchBots, fetchRoles }

export default withRouter(
  connect<StateProps, DispatchProps>(
    mapStateToProps,
    mapDispatchToProps
  )(WorkspaceSelect)
)
