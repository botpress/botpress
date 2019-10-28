import { Callout } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import User from '../components/User'

interface Props {
  sessions: any
  currentSessionId: string
  switchSession: (newSessionId: string) => void
}

export const UserList: FC<Props> = props => {
  if (!props.sessions || !props.sessions.length) {
    return <Callout>No conversation found</Callout>
  }

  return props.sessions.map(session => (
    <User
      className={cx('bph-sidebar-user', { 'bph-sidebar-user-current': session.id === props.currentSessionId })}
      key={session.id}
      session={session}
      switchSession={() => props.switchSession(session.id)}
    />
  ))
}
