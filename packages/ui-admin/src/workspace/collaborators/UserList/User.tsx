import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import style from '../style.scss'
import UserActions from './UserActions'

interface Props {
  user: WorkspaceUserWithAttributes
  showPicture: boolean
  currentUserEmail: string
  onUserUpdated: () => void
  onPasswordReset: (email, password) => void
}

const User: FC<Props> = ({ user, showPicture, currentUserEmail, onUserUpdated, onPasswordReset }) => {
  return (
    <div className={cx(style.tableRow, style.list, 'bp_table-row')} key={`user-${user.email}`}>
      <div style={{ display: 'flex' }}>
        {showPicture && (
          <div className={style.picture}>
            <img src={user.attributes.picture_url} />
          </div>
        )}

        <div className={cx(style.details, style.pullLeft)}>
          <div className={style.nameZone}>
            {_.get(user, 'attributes.firstname', '')}
            &nbsp;
            {_.get(user, 'attributes.lastname', '')}
          </div>

          <p>
            <span className={style.emailField}>
              <b>{lang.tr('email')}: </b>
              {user.email} ({user.strategy})
            </span>
          </p>
        </div>
        <div className={style.dates}>
          <span className={style.field}>
            <b>{lang.tr('admin.workspace.users.collaborators.created')}: </b>
            {moment(user.attributes.created_at).fromNow()}
          </span>
          <span className={style.field}>
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
