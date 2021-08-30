import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useContext, useEffect, useState } from 'react'

import { IUser } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'
import { generateUsername, getOrSet } from '../utils'

interface Props {
  user: IUser
}

const UserName: FC<Props> = ({ user }) => {
  const { state, dispatch } = useContext(Context)
  const [defaultUsername, setDefaultUsername] = useState()

  useEffect(() => {
    const username = getOrSet(
      () => _.get(state, `defaults.user.${user?.id}.username`),
      value => {
        dispatch({
          type: 'setDefault',
          payload: {
            user: {
              [user?.id]: {
                username: value
              }
            }
          }
        })
      },
      generateUsername()
    )

    setDefaultUsername(username)
  }, [user?.id])

  const fallback = state.config.defaultUsername ? defaultUsername : lang.tr('module.hitlnext.user.anonymous')
  const username = _.get(user, 'attributes.fullName', fallback)

  return <span className={style.clientName}>{username}</span>
}

export default UserName
