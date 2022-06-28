import { FormGroup, NumericInput, Checkbox } from '@blueprintjs/core'

import _ from 'lodash'
import React, { useState, FC, useEffect } from 'react'
import { SkillData, SkillProps } from '../../types'

const Skill: FC<SkillProps<SkillData>> = ({ onDataChanged, onValidChanged, initialData }) => {
  const [timeoutDelay, setTimeoutDelay] = useState(0)
  const [redirectNoAgent, setRedirectNoAgent] = useState(false)

  useEffect(() => {
    if (_.isEmpty(initialData)) {
      return
    }

    setTimeoutDelay(initialData.timeoutDelay)
    setRedirectNoAgent(initialData.redirectNoAgent)
  }, [])

  useEffect(() => {
    onDataChanged({
      timeoutDelay,
      redirectNoAgent
    })

    onValidChanged(true)
  }, [timeoutDelay, redirectNoAgent])

  return (
    <div>
      <FormGroup
        label="Delay before the user times out waiting for an agent (in seconds)"
        helperText="Once this delay is exceeded, the agent request is aborted (0 = never timeouts)"
      >
        <NumericInput min={0} max={9999999} onValueChange={value => setTimeoutDelay(value)} value={timeoutDelay} />
      </FormGroup>

      <FormGroup>
        <Checkbox
          label="Send user to another node if no agent is online"
          checked={redirectNoAgent}
          onChange={e => setRedirectNoAgent(e.currentTarget.checked)}
        ></Checkbox>
      </FormGroup>
    </div>
  )
}

export default Skill
