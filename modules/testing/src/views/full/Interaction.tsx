import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'

import { MdCheck, MdClose, MdRemove } from 'react-icons/md'
import { BotReply } from '../../backend/typings'
import style from './style.scss'

interface Props {
  userMessage: string
  success?: boolean
  failure?: boolean
  skipped?: boolean
  botReplies: BotReply[]
  mismatchIdx: number
  previews: { [id: string]: string }
  maxChars?: number
}

const Interaction = ({
  userMessage,
  success,
  failure,
  skipped,
  botReplies,
  mismatchIdx,
  previews,
  maxChars
}: Props) => {
  return (
    <div className={style.interaction}>
      <p className={skipped ? 'text-muted' : ''}>
        <span className={style.interactionStatus}>
          {success && <MdCheck className="text-success" />}
          {failure && <MdClose className="text-danger" />}
          {skipped && <MdRemove className="text-muted" />}
        </span>
        <strong>User</strong>
        {userMessage}
      </p>
      <div className={classnames(style.botReplies, skipped && 'text-muted')}>
        <div>
          <strong>Bot</strong>
        </div>
        <ul style={{ listStyle: 'none' }}>
          {(botReplies || []).map((reply, i) => {
            let textClass = 'text-muted'
            if (failure && mismatchIdx !== null && mismatchIdx === i) {
              textClass = 'text-danger'
            } else if (success || (mismatchIdx != null && i < mismatchIdx)) {
              textClass = 'text-success'
            }

            let element: string
            if (_.isString(reply.botResponse)) {
              element = previews[reply.botResponse]
            } else if (_.isObject(reply.botResponse) && reply.replySource.startsWith('qna')) {
              // TODO: temporary hack to render QnAs
              element = previews[reply.replySource]
            }

            return (
              <li key={i} className={textClass}>
                {element && element.slice(0, maxChars || 500)}
                {element && element.length > maxChars && '...'}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default Interaction
