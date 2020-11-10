import { Collapsible, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { EscalationType } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

import { ApiType } from './../../Api'
import Comment from './Comment'
import CommentForm from './CommentForm'
import UserProfile from './UserProfile'

interface Props {
  api: ApiType
  escalation: EscalationType
}

const Sidebar: FC<Props> = ({ escalation, api }) => {
  const { id, comments, userConversation } = escalation
  const { dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(false)

  const createComment = async (content: string) => {
    try {
      const comment = await api.createComment(id, { content })
      dispatch({ type: 'setComment', payload: comment })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    setExpanded(!!comments.length)
  }, [comments])

  return (
    <Fragment>
      <UserProfile conversation={userConversation}></UserProfile>

      {!!comments.length && (
        <Fragment>
          <div className={style.divider}></div>
          <Collapsible
            opened={expanded}
            toggleExpand={() => setExpanded(!expanded)}
            name={lang.tr('module.hitl2.comments.heading')}
            ownProps={{ transitionDuration: 0 }}
          >
            {comments.map(comment => {
              return <Comment key={comment.id} threadId={userConversation.threadId} comment={comment}></Comment>
            })}
          </Collapsible>
        </Fragment>
      )}

      <CommentForm onSubmit={createComment}></CommentForm>
    </Fragment>
  )
}

export default Sidebar
