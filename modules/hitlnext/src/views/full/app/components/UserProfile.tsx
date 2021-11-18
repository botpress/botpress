import { Collapsible, lang } from 'botpress/shared'
import flatten from 'flat'
import _ from 'lodash'
import React, { FC, useState } from 'react'

import { IUser } from '../../../../types'
import style from '../../style.scss'

import UserName from './UserName'

const UserProfile: FC<IUser> = user => {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <div className={style.profileHeader}>
        <UserName user={user} />
        {user.attributes?.email && <p>{user.attributes?.email}</p>}
      </div>
      <Collapsible
        opened={expanded}
        toggleExpand={() => setExpanded(!expanded)}
        name={lang.tr('module.hitlnext.user.variables.heading')}
        ownProps={{ transitionDuration: 10 }}
      >
        {!_.isEmpty(user.attributes) && (
          <table className={style.table}>
            <thead>
              <tr>
                <th>{lang.tr('module.hitlnext.user.variables.variable')}</th>
                <th>{lang.tr('module.hitlnext.user.variables.value')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(user.attributes).map((entry, index) => (
                <tr key={index}>
                  <td>{entry[0]}</td>
                  <td>{_.isObject(entry[1]) ? flatten(entry[1]) : entry[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Collapsible>
    </div>
  )
}

export default UserProfile
