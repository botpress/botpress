import { Collapse, Icon, Tag } from '@blueprintjs/core'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { AuthRole } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'

import User from './User'

interface Props {
  users: WorkspaceUserWithAttributes[]
  role: AuthRole
  currentUserEmail: string
  onUserUpdated: () => void
  onPasswordReset: (email: string, password: string) => void
}

const RoleSection: FC<Props> = props => {
  const [isOpen, setOpen] = useState(false)
  const { users, role } = props

  const showPicture = _.some(users, u => u.attributes && u.attributes.picture_url)

  return (
    <div key={`role-${role.id}`}>
      <div onClick={() => setOpen(!isOpen)} id={`div-role-${role.id}`} className="bp_users-role_header">
        <div className="role float-left">
          <Tag minimal={true}>{users.length}</Tag>
          <span className="title">{lang.tr(role.name)}</span>
        </div>
        {isOpen ? <Icon icon="caret-up" /> : <Icon icon="caret-down" />}
      </div>
      <Collapse isOpen={isOpen}>
        <div className="bp_table">
          {users.map(user => (
            <User
              key={user.email}
              user={user}
              showPicture={showPicture}
              currentUserEmail={props.currentUserEmail}
              onUserUpdated={props.onUserUpdated}
              onPasswordReset={props.onPasswordReset}
            />
          ))}
        </div>
      </Collapse>
    </div>
  )
}

export default RoleSection
