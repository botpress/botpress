import React from 'react'

import classnames from 'classnames'
import { MdCheck, MdClose, MdRemove } from 'react-icons/md'
import style from './style.scss'

const Interaction = ({
  userMessage,
  success,
  failure,
  skipped,
  botReplies,
  mismatchIdx,
  contentElements,
  maxChars
}) => {
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
          {botReplies.map((reply, i) => {
            let textClass = 'text-muted'
            if (failure && mismatchIdx !== null && mismatchIdx === i) {
              textClass = 'text-danger'
            } else if (success || (mismatchIdx != null && i < mismatchIdx)) {
              textClass = 'text-success'
            }

            const element = contentElements.find(el => el.id === reply.botResponse)

            return (
              <li key={i} className={textClass}>
                {element && element.preview.slice(0, maxChars || 500)}
                {element && element.preview.length > maxChars && '...'}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default Interaction
