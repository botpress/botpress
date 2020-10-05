import _ from 'lodash'
import React, { FC, useContext } from 'react'

import { ApiType } from './../Api'
import { EscalationType } from '../../../types'

import { Context } from '../Store'

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

  async function createComment(content: string) {
    try {
      const comment = await api.createComment(props.escalation.id, { content: content })
      api.updateCurrentAgentOnline({ online: true })
      dispatch({ type: 'setComment', payload: comment })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  return (
    <div>
      <UserProfile conversation={props.escalation.userConversation}></UserProfile>
      <CommentList comments={props.escalation.comments}></CommentList>
      <CommentForm onSubmit={createComment}></CommentForm>
    </div>
  )
}

export default Sidebar
