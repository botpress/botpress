import { FormGroup, InputGroup } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

import { ParameterValue } from './ActionDialog'

export const ActionParameter: FC<{
  parameterValue: ParameterValue
  unknownType: boolean
  onValueUpdated: (parameterValue: ParameterValue) => void
}> = ({ parameterValue, onValueUpdated, unknownType }) => {
  const id = `action-parameters-${parameterValue.definition.name}`

  const { name, type, required, description } = parameterValue.definition
  return (
    <FormGroup
      label={name + (required ? ' *' : '')}
      labelFor={id}
      labelInfo={type && `(${type})`}
      helperText={unknownType ? lang.tr('studio.flow.node.unknownParameterType', { type }) : description}
      intent={unknownType ? 'warning' : 'none'}
    >
      <InputGroup
        id={id}
        placeholder={lang.tr('studio.flow.node.valuePlaceholder')}
        value={parameterValue.value || parameterValue.definition.default?.toString()}
        onChange={e => onValueUpdated({ ...parameterValue, value: e.target.value })}
        disabled={unknownType}
      />
    </FormGroup>
  )
}
