import { Callout, InputGroup } from '@blueprintjs/core'
import { CHAT_USER_ROLE } from 'common/defaults'
import { AuthRole, UserProfile, WorkspaceUserInfo } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { filterList } from '~/utils/util'
import LoadingSection from '~/Pages/Components/LoadingSection'

import RoleSection from '../UserList/RoleSection'

const userFilterFields = ['email', 'attributes.firstname', 'attributes.lastname']

interface StateProps {
  profile: UserProfile
  users: WorkspaceUserInfo[]
  loading: boolean
  roles: AuthRole[]
}

interface DispatchProps {}

interface OwnProps {
  onPasswordReset: any
  onUserUpdated: () => void
}

type Props = StateProps & OwnProps

const UserList: FC<Props> = props => {
  const [filter, setFilter] = useState('')

  if (!props.users || props.loading || !props.roles) {
    return <LoadingSection />
  }

  if (!props.users.length) {
    return <Callout title="This workspace has no collaborators, yet" style={{ textAlign: 'center' }} />
  }

  const currentUserEmail = props.profile && props.profile.email
  const filteredUsers = filterList<WorkspaceUserInfo>(props.users, userFilterFields, filter)
  const roles = [...props.roles, CHAT_USER_ROLE]

  return (
    <div>
      <InputGroup
        id="input-filter"
        placeholder="Filter users"
        value={filter}
        onChange={e => setFilter(e.target.value.toLowerCase())}
        autoComplete="off"
        className="filterField"
      />

      <div className="bp_users-container">
        {filter && !filteredUsers.length && <Callout title="No user matches your query" className="filterCallout" />}

        {roles.map(role => {
          const users = filteredUsers.filter(user => user.role === role.id)
          return users.length ? (
            <RoleSection
              key={role.id}
              users={users}
              role={role}
              currentUserEmail={currentUserEmail}
              onUserUpdated={props.onUserUpdated}
              onPasswordReset={props.onPasswordReset}
            />
          ) : null
        })}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  profile: state.user.profile,
  roles: state.roles.roles,
  users: state.user.users,
  loading: state.user.loadingUsers
})

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  {}
)(UserList)
