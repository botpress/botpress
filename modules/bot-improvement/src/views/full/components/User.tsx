import { Icon, Intent, Text } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { HitlSessionOverview } from '../../../backend/typings'

interface Props {
  session: HitlSessionOverview
  className?: string
  switchSession: () => void
}

const User: FC<Props> = props => {
  const { lastEventOn, user, lastMessage, isPaused } = props.session

  const dateFormatted = moment(lastEventOn)
    .fromNow()
    .replace('minutes', 'mins')
    .replace('seconds', 'secs')

  const textPrefix = lastMessage.direction === 'in' ? 'User: ' : 'Bot: '
  const displayName = _.get(user, 'attributes.full_name', user.fullName)
  const avatarUrl = _.get(user, 'attributes.picture_url', user.avatarUrl)

  return (
    <div className={classnames('bph-user-container', props.className)} onClick={props.switchSession}>
      <img src={avatarUrl} className="bph-picture-small" />

      <div style={{ display: 'flex' }} className="bph-user-container-info">
        <div>
          <div className="bph-user-name">{displayName}</div>
          <span>
            <Text ellipsize={true} className="bph-user-summary">
              <span className="bph-user-source">{textPrefix}</span>
              {lastMessage.text}
            </Text>
          </span>
        </div>

        <div className="bph-user-date">{dateFormatted}</div>
        <div className="bph-user-paused">
          {!!isPaused && <Icon icon="pause" intent={Intent.PRIMARY} className="bph-user-paused-active" />}
        </div>
      </div>
    </div>
  )
}

export default User
