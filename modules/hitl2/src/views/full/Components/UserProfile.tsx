import _ from 'lodash'
import React, { FC, useState } from 'react'
import hash from 'object-hash'
import Haikunator from 'haikunator'

import { EventType } from '../../../types'

import { HTMLTable } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import Collapsible from '../../../../../../src/bp/ui-shared-lite/Collapsible'

interface Props {
  conversation: EventType
}

const UserProfile: FC<Props> = props => {
  const [expanded, setExpanded] = useState(true)
  const [userNames, setUserNames] = useState({})
  const [haiku, sethaiku] = useState(() => {
    return new Haikunator({ defaults: { tokenLength: 0 } })
  })

  const user = _.get(JSON.parse(props.conversation.event), 'state.user', {})

  const variables = _.omit(user, 'language', 'timezone', 'fullname', 'emil')

  function defaultUserName(): string {
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

      <Collapsible
        opened={expanded}
        toggleExpand={() => setExpanded(!expanded)}
        name={lang.tr('module.hitl2.user.variables.heading')}
      >
        {_.isEmpty(variables) ? (
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
              {Object.entries(variables).map((entry, index) => (
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
