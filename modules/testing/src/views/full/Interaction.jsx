import React from 'react'

import classnames from 'classnames'
import { MdCheck, MdClose, MdRemove } from 'react-icons/md'
import style from './style.scss'

const Interaction = ({ userMessage, success, failure, skipped, botReplies, mismatchIdx, previews, maxChars }) => {
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

            let element
            if (_.isString(reply.botResponse)) {
              element = previews[reply.botResponse]
            } else if (_.isObject(reply.botResponse) && reply.replySource.startsWith('qna')) {
              // temporary hack to render qnas
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
