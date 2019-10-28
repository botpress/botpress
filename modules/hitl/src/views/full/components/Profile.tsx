import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { User } from '../../../backend/typings'
import { Attribute } from '../../../config'

import { Avatar } from './Avatar'
import { Formatter } from './Formatter'

interface Props {
  user: User
  lastHeardOn: Date
  attributesConfig?: Attribute[]
}

const Profile: FC<Props> = props => {
  const dateFormatted = moment(props.lastHeardOn)
    .fromNow()
    .replace('minutes', 'mins')
    .replace('seconds', 'secs')

  const displayName = _.get(props.user, 'attributes.full_name')
  const avatarUrl = _.get(props.user, 'attributes.picture_url', props.user.avatarUrl)

  return (
    <div className="bph-profile">
      <div className="bph-profile-header">
        <Avatar url={avatarUrl} className="picture" />

        <div className="displayName">{displayName}</div>
        <div className="date">{dateFormatted}</div>
      </div>
      <div className="attributes">
        {props.attributesConfig &&
          props.attributesConfig.map(attr => (
            <div className="bph-profile-attribute" key={attr.label}>
              <label>{attr.label}:</label>
              <span>
                <Formatter attributes={props.user.attributes} config={attr} />
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

export default Profile
