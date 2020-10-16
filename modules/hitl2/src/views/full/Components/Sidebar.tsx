import _ from 'lodash'
import React, { FC, useContext, useEffect, useState } from 'react'
import cx from 'classnames'

import { Context } from '../app/Store'

import { ApiType } from './../Api'
import { EscalationType } from '../../../types'

import { lang } from 'botpress/shared'
import Collapsible from '../../../../../../src/bp/ui-shared-lite/Collapsible'
import UserProfile from './UserProfile'
import CommentList from './CommentList'
import CommentForm from './CommentForm'

import styles from './../style.scss'

interface Props {
  api: ApiType
  escalation: EscalationType
}

const Sidebar: FC<Props> = props => {
  const { api } = props

  const { dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(false)

  async function createComment(content: string) {
    try {
      const comment = await api.createComment(props.escalation.id, { content: content })
      api.setOnline()
      dispatch({ type: 'setComment', payload: comment })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    setExpanded(!_.isEmpty(props.escalation.comments))
  }, [props.escalation.comments])

  return (
    <div className={cx(styles.h100)} style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
      <div className={cx(styles.w100)}>
        <UserProfile conversation={props.escalation.userConversation}></UserProfile>
      </div>

      <div className={cx(styles.w100)}>
        <Collapsible
          opened={expanded}
          toggleExpand={() => setExpanded(!expanded)}
          name={lang.tr('module.hitl2.comments.heading')}
        >
          <CommentList comments={props.escalation.comments}></CommentList>
        </Collapsible>
      </div>

      <div style={{ width: '100%', marginTop: 'auto' }}>
        <CommentForm onSubmit={createComment}></CommentForm>
      </div>
    </div>
  )
}

export default Sidebar
