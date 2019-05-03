import React from 'react'

import classnames from 'classnames'
import { MdCheck, MdClose, MdRemove } from 'react-icons/md'
import style from './style.scss'

const Interaction = ({ step, stepIndex, completedSteps, scenarioStatus, mismatch }) => {
  const success = stepIndex < completedSteps
  const failure = scenarioStatus === 'fail' && stepIndex === completedSteps
  const skipped = scenarioStatus == 'fail' && stepIndex > completedSteps

  return (
    <div className={style.interaction}>
      <p className={skipped ? 'text-muted' : ''}>
        <div className={style.interactionStatus}>
          {success && <MdCheck className="text-success" />}
          {failure && <MdClose className="text-danger" />}
          {skipped && <MdRemove className="text-muted" />}
        </div>
        <strong>User</strong>
        {step.userMessage}
      </p>
      <div className={classnames(style.botReplies, skipped && 'text-muted')}>
        <div>
          <strong>Bot</strong>
        </div>
        <ul style={{ listStyle: 'none' }}>
          {step.botReplies.map((reply, i) => {
            let textClass = 'text-muted'
            if (failure && mismatch && mismatch.index === i) {
              textClass = 'text-danger'
            } else if (success || (mismatch && i < mismatch.index)) {
              textClass = 'text-success'
            }
            return <li className={textClass}>{reply.botResponse}</li>
          })}
        </ul>
      </div>
    </div>
  )
}

export default Interaction
