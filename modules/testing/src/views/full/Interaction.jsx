import React from 'react'

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
        <strong>User:&nbsp;</strong>
        {step.userMessage}
      </p>
      <p className={skipped ? 'text-muted' : ''} style={{ marginLeft: 25 }}>
        <strong>Bot:</strong>
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
      </p>
    </div>
  )
}

export default Interaction
