import _ from 'lodash'
import React, { FC } from 'react'

import { ParameterValue } from './ActionDialog'
import { ActionParameter } from './ActionParameter'

const HTTP_ACTIONS_PARAM_TYPES = ['string', 'number', 'boolean']

export const ActionParameters: FC<{
  parameterValues: ParameterValue[]
  onUpdate: (parameterValues: ParameterValue[]) => void
}> = props => {
  const { onUpdate, parameterValues } = props

  return (
    <React.Fragment>
      {parameterValues.map((parameterValue, idx) => {
        const { name, type } = parameterValue.definition
        return (
          <ActionParameter
            key={name}
            unknownType={!HTTP_ACTIONS_PARAM_TYPES.includes(type)}
            parameterValue={parameterValue}
            onValueUpdated={parameterValue => {
              const copy = [...parameterValues]
              copy[idx] = { ...parameterValue }
              onUpdate(copy)
            }}
          />
        )
      })}
    </React.Fragment>
  )
}
