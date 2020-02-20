import { FormGroup, InputGroup } from '@blueprintjs/core'
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
    <FormGroup
      label={parameterValue.definition.name + (parameterValue.definition.required ? ' *' : '')}
      labelFor={id}
      labelInfo={parameterValue.definition.type && `(${parameterValue.definition.type})`}
      helperText={parameterValue.definition.description}
    >
      <InputGroup
        id={id}
        placeholder="Value"
        value={parameterValue.value || parameterValue.definition.default}
        onChange={e => onValueUpdated({ ...parameterValue, value: e.target.value })}
      />
    </FormGroup>
  )
}
