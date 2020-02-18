import { Button, ControlGroup, InputGroup } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'

import { Parameter } from './ActionDialog'

interface ActionParameterProps {
  parameter: Parameter
  onRemove: (parameter: Parameter) => void
  onKeyUpdated: (key: string) => void
  onValueUpdated: (value: string) => void
}

export const ActionParameter: FC<ActionParameterProps> = props => {
  const { parameter, onRemove, onKeyUpdated, onValueUpdated } = props

  const id = `action-parameters-${parameter.key}`

  return (
    <ControlGroup id={id}>
      <InputGroup id={id} placeholder="Name" value={parameter.key} onChange={e => onKeyUpdated(e.target.value)} />
      <InputGroup id={id} placeholder="Value" value={parameter.value} onChange={e => onValueUpdated(e.target.value)} />
      <Button onClick={e => onRemove(parameter)} icon="remove" />
    </ControlGroup>
  )
}

interface ActionParametersProps {
  parameters: Parameter[]
  onUpdate: (parameters: Parameter[]) => void
}

export const ActionParameters: FC<ActionParametersProps> = props => {
  const { onUpdate, parameters } = props

  return (
    <React.Fragment>
      {parameters.map((parameter, idx) => {
        const { key, value } = parameter
        return (
          <ActionParameter
            key={idx}
            parameter={parameter}
            onKeyUpdated={newKey => {
              const copy = [...parameters]
              copy[idx] = { key: newKey, value }
              onUpdate(copy)
            }}
            onValueUpdated={value => {
              const copy = [...parameters]
              copy[idx] = { key, value }
              onUpdate(copy)
            }}
            onRemove={parameter => {
              const copy = [...parameters]
              copy.splice(idx, 1)
              onUpdate(copy)
            }}
          />
        )
      })}
      <Button
        onClick={e => {
          onUpdate([...parameters, { key: '', value: '' }])
        }}
      >
        Add Parameter
      </Button>
    </React.Fragment>
  )
}
