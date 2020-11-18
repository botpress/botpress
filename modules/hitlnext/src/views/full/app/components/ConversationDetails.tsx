import { Collapsible, lang, Tabs } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { IHandoff } from '../../../../types'
import style from '../../style.scss'
import { ApiType } from '../../Api'
import { Context } from '../Store'

import Comment from './Comment'
import CommentForm from './CommentForm'
import UserProfile from './UserProfile'

interface Props {
  api: ApiType
  handoff: IHandoff
}

const ConversationDetails: FC<Props> = ({ handoff, api }) => {
  const { id, comments, user } = handoff
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
    setExpanded(!_.isEmpty(comments))
  }, [comments])

  return (
    <div className={cx(style.column, style.sidebarContainer)}>
      <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitlnext.handoff.contactDetails') }]} />
      <UserProfile {...user} />

      {!_.isEmpty(comments) && (
        <Fragment>
          <div className={style.divider}></div>
          <Collapsible
            opened={expanded}
            toggleExpand={() => setExpanded(!expanded)}
            name={lang.tr('module.hitlnext.comments.heading')}
            ownProps={{ transitionDuration: 0 }}
          >
            {comments.map(comment => {
              return <Comment key={comment.id} {...comment}></Comment>
            })}
          </Collapsible>
        </Fragment>
      )}

      <CommentForm onSubmit={createComment}></CommentForm>
    </div>
  )
}

export default ConversationDetails
