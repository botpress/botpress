import _ from 'lodash'
import React, { FC, useContext, useState } from 'react'

import { Context } from '../app/Store'

import { ApiType } from './../Api'
import { EscalationType } from '../../../types'

import { lang } from 'botpress/shared'
import Collapsible from '../../../../../../src/bp/ui-shared-lite/Collapsible'
import UserProfile from './UserProfile'
import CommentList from './CommentList'
import CommentForm from './CommentForm'

interface Props {
  api: ApiType
  escalation: EscalationType
}

const Sidebar: FC<Props> = props => {
  const { api } = props

  const { dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(true)

  async function createComment(content: string) {
    try {
      const comment = await api.createComment(props.escalation.id, { content: content })
      api.setOnline()
      dispatch({ type: 'setComment', payload: comment })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  return (
    <div>
      <UserProfile conversation={props.escalation.userConversation}></UserProfile>
      <Collapsible
        opened={expanded}
        toggleExpand={() => setExpanded(!expanded)}
        name={lang.tr('module.hitl2.comments.heading')}
      >
        <CommentList comments={props.escalation.comments}></CommentList>
      </Collapsible>
      <CommentForm onSubmit={createComment}></CommentForm>
    </div>
  )
}

export default Sidebar
