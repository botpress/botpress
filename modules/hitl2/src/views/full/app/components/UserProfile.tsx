import { Collapsible, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { EventType, UserType } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

import { generateUsername, getOrSet } from './../utils'

interface Props {
  conversation: EventType
}

const UserProfile: FC<Props> = ({ conversation }) => {
  const { state, dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(false)
  const [user, setUser] = useState<UserType>()
  const [defaultUsername, setDefaultUsername] = useState<string>()

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

  const userName = () => {
    return (user && user.fullName) || state.config.defaultUsername
      ? defaultUsername
      : lang.tr('module.hitl2.user.anonymous')
  }

  return (
    <div>
      <div className={style.profileHeader}>
        <span className={style.clientName}>{userName()}</span>
        {user && <p>{user.email}</p>}
      </div>

      {user && !_.isEmpty(user.variables) && (
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
