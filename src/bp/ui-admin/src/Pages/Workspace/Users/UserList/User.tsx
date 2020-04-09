import { lang } from 'botpress/shared'
import { WorkspaceUser } from 'common/typings'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import UserActions from './UserActions'

interface Props {
  user: WorkspaceUser & { attributes: any }
  showPicture: boolean
  currentUserEmail: string
  onUserUpdated: () => void
  onPasswordReset: (email, password) => void
}

const User: FC<Props> = ({ user, showPicture, currentUserEmail, onUserUpdated, onPasswordReset }) => {
  return (
    <div className="bp_table-row bp_users-list" key={'user-' + user.email}>
      <div style={{ display: 'flex' }}>
        {showPicture && (
          <div className="bp_users-picture">
            <img src={user.attributes.picture_url} />
          </div>
        )}

        <div className="pullLeft details">
          <div className="nameZone">
            {_.get(user, 'attributes.firstname', '')}
            &nbsp;
            {_.get(user, 'attributes.lastname', '')}
          </div>

          <p>
            <span className="emailField">
              <b>{lang.tr('email')}: </b>
              {user.email} ({user.strategy})
            </span>
          </p>
        </div>
        <div className="dates">
          <span className="field">
            <b>{lang.tr('admin.workspace.users.collaborators.created')}: </b>
            {moment(user.attributes.created_at || user.attributes.createdOn).fromNow()}
          </span>
          <span className="field">
            <b>{lang.tr('admin.workspace.users.collaborators.lastLogin')}: </b>
            {user.attributes.last_logon ? moment(user.attributes.last_logon).fromNow() : 'never'}
          </span>
        </div>
      </div>
      <div>
        {user.email.toLowerCase() !== currentUserEmail && (
          <UserActions user={user} onUserUpdated={onUserUpdated} onPasswordReset={onPasswordReset} />
        )}
      </div>
    </div>
  )
}

export default User
