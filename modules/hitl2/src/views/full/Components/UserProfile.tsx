import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { Divider } from '@blueprintjs/core'
import hash from 'object-hash'
import Haikunator from 'haikunator'
import { EventType } from '../../../types'

interface Props {
  conversation: EventType
}

const UserProfile: FC<Props> = props => {
  const [userNames, setUserNames] = useState({})
  const [haiku, sethaiku] = useState(() => {
    return new Haikunator({ defaults: { tokenLength: 0 } })
  })

  const user = _.get(JSON.parse(props.conversation.event), 'state.user', {})

  function defaultUserName() {
    const key = hash(_.pick(props.conversation, ['channel', 'threadId']))

    if (!userNames[key]) {
      userNames[key] = haiku.haikunate({ delimiter: ' ' })
      setUserNames(userNames)
    }

    return userNames[key]
  }

  return (
    <div>
      <ul>
        <li>fullName: {user.fullName || defaultUserName()}</li>
        <li>email: {user.email}</li>
        <li>timezone: {user.timezone}</li>
        <li>language: {user.language}</li>
      </ul>

      <Divider></Divider>

      {user.variables ? (
        <ul>
          {user.variables.map((variable, index) => {
            return (
              <li key={index}>
                {variable.name} : {variable.value}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default UserProfile
