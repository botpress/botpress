import { lang, Tabs } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC } from 'react'

import { IHandoff } from '../../../../types'
import { HitlClient } from '../../../client'
import style from '../../style.scss'
import { Comments } from './Comments'

import { Tags } from './Tags'
import UserProfile from './UserProfile'

interface Props {
  api: HitlClient
  handoff: IHandoff
}

const ConversationDetails: FC<Props> = ({ api, handoff }) => (
  <div className={cx(style.column, style.sidebarContainer)}>
    <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitlnext.handoff.contactDetails') }]} />
    <UserProfile {...handoff.user} />
    <div className={style.divider}></div>
    <Tags handoff={handoff} api={api} />
    <div className={style.divider}></div>
    <Comments handoff={handoff} api={api} />
  </div>
)

export default ConversationDetails
