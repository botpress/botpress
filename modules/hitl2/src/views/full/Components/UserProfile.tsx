import { Collapsible, lang } from 'botpress/shared'
import Haikunator from 'haikunator'
import _ from 'lodash'
import hash from 'object-hash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import { EventType, UserType } from '../../../types'
import style from '../style.scss'

interface Props {
  conversation: EventType
}

const UserProfile: FC<Props> = props => {
  const [expanded, setExpanded] = useState(false)
  const [user, setUser] = useState({} as UserType)
  const defaultUserName = useRef<string>()
  const [haiku] = useState(() => {
    return new Haikunator({ defaults: { tokenLength: 0 } })
  })

  useEffect(() => {
    setUser(_.get(JSON.parse(props.conversation.event), 'state.user', {}))
  }, [props.conversation])

  if (!defaultUserName.current) {
    defaultUserName.current = haiku.haikunate({ delimiter: ' ' })
  }

  return (
    <div>
      <div className={style.profileHeader}>
        {/* TODO Add click action here */}
        <button className={style.clientName} onClick={() => {}}>
          {user.fullName || defaultUserName.current}
        </button>
        {/* TODO Should add company name here */}
        {user.email && <p>{user.email}</p>}
      </div>

      {!!user?.variables?.length && (
        <Fragment>
          <div className={style.divider}></div>
          <Collapsible
            opened={expanded}
            toggleExpand={() => setExpanded(!expanded)}
            name={lang.tr('module.hitl2.user.variables.heading')}
          >
            <table className={style.table}>
              <thead>
                <tr>
                  <th>{lang.tr('module.hitl2.user.variables.variable')}</th>
                  <th>{lang.tr('module.hitl2.user.variables.value')}</th>
                </tr>
              </thead>
              <tbody>
                {user.variables.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.name}</td>
                    <td>{entry.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Collapsible>
        </Fragment>
      )}
    </div>
  )
}

export default UserProfile
