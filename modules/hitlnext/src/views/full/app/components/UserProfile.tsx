import { Collapsible, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { IEvent } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

import { generateUsername, getOrSet } from './../utils'

interface Props {
  conversation: IEvent
}

const UserProfile: FC<Props> = ({ conversation }) => {
  const { state, dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(true)
  const [variables, setVariables] = useState({})
  const [defaultUsername, setDefaultUsername] = useState<string>()

  useEffect(() => {
    setVariables(_.get(conversation.event, 'state.user'))
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
    return (variables && variables['fullName']) || state.config.defaultUsername
      ? defaultUsername
      : lang.tr('module.hitlnext.user.anonymous')
  }

  return (
    <div>
      <div className={style.profileHeader}>
        <span className={style.clientName}>{userName()}</span>
        {variables && variables['email'] && <p>{variables['email']}</p>}
      </div>

      {!_.isEmpty(variables) && (
        <Fragment>
          <div className={style.divider}></div>
          <Collapsible
            opened={expanded}
            toggleExpand={() => setExpanded(!expanded)}
            name={lang.tr('module.hitlnext.user.variables.heading')}
          >
            <table className={style.table}>
              <thead>
                <tr>
                  <th>{lang.tr('module.hitlnext.user.variables.variable')}</th>
                  <th>{lang.tr('module.hitlnext.user.variables.value')}</th>
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
            </table>
          </Collapsible>
        </Fragment>
      )}
    </div>
  )
}

export default UserProfile
