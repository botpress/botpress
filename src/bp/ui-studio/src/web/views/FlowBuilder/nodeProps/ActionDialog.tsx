import { Button, Dialog, FormGroup, HTMLSelect, Label, NonIdealState } from '@blueprintjs/core'
import axios from 'axios'
import { ActionParameterDefinition, ActionServerWithActions } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { Action, Parameters } from '../diagram/nodes_v2/ActionNode'

import style from './style.scss'
import { ActionParameters } from './ActionParameters'
export interface ParameterValue {
  definition: ActionParameterDefinition
  value: string
}

interface ActionDialogProps {
  name: string
  parameters: Parameters
  actionServerId: string
  isOpen: boolean
  onClose: () => void
  onSave: (action: Action) => void
}

const ActionDialog: FC<ActionDialogProps> = props => {
  const { isOpen, onClose, onSave } = props

  const [actionServers, setActionServers] = useState<ActionServerWithActions[]>([])
  const [name, setName] = useState(props.name)
  const [parameters, setParameters] = useState(props.parameters)
  const [actionServerId, setActionServerId] = useState(props.actionServerId)

  useEffect(() => {
    const fetchActionServers = async () => {
      const response = await axios.get(`${window.BOT_API_PATH}/actionServers`)
      setActionServers(response.data)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchActionServers()
  }, [])

  if (actionServers.length === 0) {
    return null
  }

  const actionIsValid = () => {
    return !!name && !!actionServerId
  }

  const isNewNode = name === '' && _.isEmpty(parameters) && actionServerId === ''
  if (isNewNode) {
    const defaultActionServer = actionServers[0]
    const defaultAction = defaultActionServer.actions[0]

    const defaultName = defaultAction?.name
    const defaultParameters = {}
    const defaultActionServerId = defaultActionServer.id

    setName(defaultName)
    setParameters(defaultParameters)
    setActionServerId(defaultActionServerId)
    if (actionIsValid()) {
      onSave({ name: defaultName, parameters: defaultParameters, actionServerId: defaultActionServerId })
    }
    return null
  }
  const currentActionServer = actionServers.find(s => s.id === actionServerId)
  const currentActionDefinition =
    currentActionServer.actions.find(a => a.name === name) || currentActionServer.actions[0]

  return (
    <Dialog isOpen={isOpen} title="Edit Action" icon="offline" onClose={() => onClose()}>
      <div
        className={style.actionDialogContent}
        onMouseDown={e => {
          // TODO: check for a more elegant way to stop event propagation
          e.stopPropagation()
        }}
        onContextMenu={e => {
          // TODO: check for a more elegant way to stop event propagation
          e.stopPropagation()
        }}
      >
        <Label>
          Action Server
          <HTMLSelect
            value={actionServerId}
            onChange={e => {
              e.preventDefault()
              const actionServerId = e.target.value
              setActionServerId(actionServerId)
              const actionServer = actionServers.find(s => s.id === actionServerId)
              setName(actionServer.actions[0].name)
            }}
          >
            {actionServers.map(actionServer => (
              <option key={actionServer.id} value={actionServer.id}>
                {actionServer.id} ({actionServer.baseUrl})
              </option>
            ))}
          </HTMLSelect>
        </Label>

        {currentActionDefinition && (
          <>
            <FormGroup
              helperText="This is the action that will be executed on the chosen Action Server"
              label="Action Name"
              labelFor="action-name"
              labelInfo="(required)"
            >
              <HTMLSelect
                id="action-name"
                value={currentActionDefinition.name}
                onChange={e => {
                  setName(e.target.value)
                }}
              >
                {currentActionServer.actions.map(actionDefinition => (
                  <option key={actionDefinition.name} value={actionDefinition.name}>
                    {actionDefinition.name}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>

            <FormGroup
              label="Action Parameters"
              labelFor="action-parameters"
              helperText={currentActionDefinition.parameters.length === 0 ? 'This action has no parameters' : undefined}
            >
              <ActionParameters
                parameterValues={currentActionDefinition.parameters.map(parameterDefinition => {
                  return { definition: parameterDefinition, value: parameters[parameterDefinition.name] || '' }
                })}
                onUpdate={parameterValues => {
                  const paramsObj = parameterValues.reduce((previousValue, parameterValue) => {
                    previousValue[parameterValue.definition.name] = parameterValue.value
                    return previousValue
                  }, {})

                  setParameters(paramsObj)
                }}
              />
            </FormGroup>
          </>
        )}

        {currentActionServer.actions.length === 0 && (
          <NonIdealState icon="warning-sign" title="No actions found on this Action Server" />
        )}

        <Button
          onClick={() => {
            onSave({ name, actionServerId, parameters })
          }}
          disabled={!actionIsValid()}
        >
          Save
        </Button>
      </div>
    </Dialog>
  )
}

export default ActionDialog
