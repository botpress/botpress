import React from 'react'

import classnames from 'classnames'
import style from './style.scss'

const Interaction = ({ userMessage, botReplies }) => {
  return (
    <div className={style.interaction}>
      <div className={classnames(style.userMessage)}>
        <p>
          <strong>User</strong>
          {userMessage}
        </p>
      </div>
      <div className={classnames(style.botReplies)}>
        <div>
          <strong>Bot</strong>
        </div>
        <ul style={{ listStyle: 'none' }}>
          {(botReplies || []).map((reply, i) => {
            return <li key={i}>{reply && reply.preview}</li>
          })}
        </ul>
      </div>
    </div>
  )
}

export default Interaction
