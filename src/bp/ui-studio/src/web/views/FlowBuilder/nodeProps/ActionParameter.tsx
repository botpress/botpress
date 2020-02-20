import { ControlGroup, InputGroup } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'

import { ParameterValue } from './ActionDialog'

interface ActionParameterProps {
  parameterValue: ParameterValue
  onValueUpdated: (parameterValue: ParameterValue) => void
}

export const ActionParameter: FC<ActionParameterProps> = props => {
  const { parameterValue, onValueUpdated } = props

  const id = `action-parameters-${parameterValue.definition.name}`

  return (
    <ControlGroup id={id}>
      <InputGroup id={id} placeholder="Name" disabled value={parameterValue.definition.name} />
      <InputGroup
        id={id}
        placeholder="Value"
        value={parameterValue.value}
        onChange={e => onValueUpdated({ ...parameterValue, value: e.target.value })}
      />
    </ControlGroup>
  )
}
