import { Collapsible, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useContext, useState } from 'react'

import { EventType, UserType } from '../../../types'
import { generateUsername, getOrSet } from './../app/utils'
import { Context } from '../app/Store'
import style from '../style.scss'

interface Props {
  conversation: EventType
}

const UserProfile: FC<Props> = ({ conversation }) => {
  const { state, dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(false)
  const [user, setUser] = useState({} as UserType)
  const [defaultUsername, setDefaultUsername] = useState()

  useEffect(() => {
    setUser(_.get(conversation.event, 'state.user', {}))
  }, [conversation])

  useEffect(() => {
    const key = _.get(conversation.event, 'target')
    const username = getOrSet(
      () => {
        return _.get(state, `defaults.user.${key}.username`)
      },
      value => {
        dispatch({
          type: 'setDefault',
          payload: {
            user: {
              [key]: {
                username: value
              }
            }
          }
        })
      },
      generateUsername()
    )

    setDefaultUsername(username)
  }, [conversation])

  const variables = user?.variables?.filter(x => !['fullname', 'email'].includes(x.name)) || []

  return (
    <div>
      <div className={style.profileHeader}>
        {/* TODO Add click action here */}
        <button className={style.clientName}>{user.fullName || defaultUsername}</button>
        {/* TODO Should add company name here */}
        {user.email && <p>{user.email}</p>}
      </div>

      {!_.isEmpty(variables.length) && (
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
                {variables.map((entry, index) => (
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
