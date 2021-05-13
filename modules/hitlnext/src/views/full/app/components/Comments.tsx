import { Collapsible, EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useState } from 'react'

import { IHandoff } from '../../../../types'
import { HitlClient } from '../../../client'
import { Context } from '../Store'

import Comment from './Comment'
import CommentForm from './CommentForm'

interface Props {
  api: HitlClient
  handoff: IHandoff
}

export const Comments: FC<Props> = ({ handoff, api }) => {
  const { comments, id } = handoff
  const { dispatch } = useContext(Context)

  const [expanded, setExpanded] = useState(true)

  const createComment = async (content: string) => {
    try {
      await api.createComment(id, { content })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  return (
    <Fragment>
      <Collapsible
        opened={expanded}
        toggleExpand={() => setExpanded(!expanded)}
        name={lang.tr('module.hitlnext.comments.heading')}
        ownProps={{ transitionDuration: 10 }}
      >
        {_.isEmpty(comments) && <EmptyState text={lang.tr('module.hitlnext.comments.empty')} />}
        {!_.isEmpty(comments) &&
          comments.map(comment => {
            return <Comment key={comment.id} {...comment}></Comment>
          })}
        <CommentForm onSubmit={createComment}></CommentForm>
      </Collapsible>
    </Fragment>
  )
}
