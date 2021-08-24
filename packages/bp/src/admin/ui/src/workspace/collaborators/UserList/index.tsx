import { Callout, InputGroup } from '@blueprintjs/core'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { CHAT_USER_ROLE } from 'common/defaults'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import LoadingSection from '~/app/common/LoadingSection'
import { AppState } from '~/app/rootReducer'
import { filterList } from '~/workspace/util'
import style from '../style.scss'
import RoleSection from '../UserList/RoleSection'

const userFilterFields = ['email', 'attributes.firstname', 'attributes.lastname']

type Props = {
  onPasswordReset: any
  onUserUpdated: () => void
} & ConnectedProps<typeof connector>

const UserList: FC<Props> = props => {
  const [filter, setFilter] = useState('')

  if (!props.users || props.loading || !props.roles) {
    return <LoadingSection />
  }

  if (!props.users.length) {
    return (
      <Callout
        title={lang.tr('admin.workspace.users.collaborators.noCollaboratorsYet')}
        style={{ textAlign: 'center' }}
      />
    )
  }

  const currentUserEmail = _.get(props.profile, 'email', '').toLowerCase()
  const filteredUsers = filterList<WorkspaceUserWithAttributes>(props.users, userFilterFields, filter)
  const roles = props.roles

  return (
    <div>
      <div className={style.filterWrapper}>
        <InputGroup
          id="input-filter"
          placeholder={lang.tr('admin.workspace.users.collaborators.filterUsers')}
          value={filter}
          onChange={e => setFilter(e.target.value.toLowerCase())}
          autoComplete="off"
        />
      </div>

      <div className={style.container}>
        {filter && !filteredUsers.length && (
          <Callout title={lang.tr('admin.workspace.users.collaborators.noMatch')} className={style.filterCallout} />
        )}

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

const mapStateToProps = (state: AppState) => ({
  profile: state.user.profile,
  roles: state.roles.roles,
  users: state.collaborators.users,
  loading: state.collaborators.loading
})

const connector = connect(mapStateToProps)

export default connector(UserList)
