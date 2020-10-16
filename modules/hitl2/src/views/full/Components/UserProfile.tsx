import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import hash from 'object-hash'
import Haikunator from 'haikunator'

import { EventType, UserType } from '../../../types'

import { Divider, HTMLTable } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import Collapsible from '../../../../../../src/bp/ui-shared-lite/Collapsible'

interface Props {
  conversation: EventType
}

const UserProfile: FC<Props> = props => {
  const [expanded, setExpanded] = useState(!_.isEmpty(variables()))
  const [user, setUser] = useState({} as UserType)
  const [userNames, setUserNames] = useState({})
  const [haiku] = useState(() => {
    return new Haikunator({ defaults: { tokenLength: 0 } })
  })

  useEffect(() => {
    setUser(_.get(JSON.parse(props.conversation.event), 'state.user', {}))
  }, [props.conversation])

  function defaultUserName(): string {
    const key = hash(_.pick(props.conversation, ['channel', 'threadId']))

    if (!userNames[key]) {
      userNames[key] = haiku.haikunate({ delimiter: ' ' })
      setUserNames(userNames)
    }

    return userNames[key]
  }

  function variables() {
    return _.omit(user, 'fullname', 'email')
  }

  return (
    <div>
      <h6 className="bp3-heading" style={{ color: 'var(--ocean)' }}>
        {user.fullName || defaultUserName()}
      </h6>
      {user.email && <p>{user.email}</p>}

      <Divider></Divider>

      <Collapsible
        opened={expanded}
        toggleExpand={() => setExpanded(!expanded)}
        name={lang.tr('module.hitl2.user.variables.heading')}
      >
        {_.isEmpty(variables()) ? (
          <EmptyState text={lang.tr('module.hitl2.user.variables.empty')}></EmptyState>
        ) : (
          <HTMLTable condensed={true} width="100%">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(variables()).map((entry, index) => (
                <tr key={index}>
                  <td>{entry[0]}</td>
                  <td>{entry[1]}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        )}
      </Collapsible>
    </div>
  )
}

export default UserProfile
