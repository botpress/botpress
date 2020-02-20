import { Button, Dialog, FormGroup, H3, HTMLSelect, Label, NonIdealState } from '@blueprintjs/core'
import { ActionParameterDefinition, ActionServersWithActions } from 'common/typings'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'

import { Action } from '../diagram/nodes_v2/ActionNode'

import { ActionParameters } from './ActionParameters'
export interface ParameterValue {
  definition: ActionParameterDefinition
  value: string
}

interface ActionDialogProps {
  action: Action
  actionIsValid: boolean
  actionServers: ActionServersWithActions[]
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onUpdate: (action: Action) => void
}

const ActionDialog: FC<ActionDialogProps> = props => {
  const { action, actionServers, isOpen, onClose, onSave, onUpdate, actionIsValid } = props

  const currentActionServer = actionServers.find(s => s.id === action.actionServerId)
  const currentActionDefinition = currentActionServer.actions.find(a => a.name === action.name)

  return (
    <Dialog isOpen={isOpen} title="Edit Action" icon="offline" onClose={() => onClose()}>
      <div
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
            value={action.actionServerId}
            onChange={e => {
              e.preventDefault()
              const copy = _.cloneDeep(action)
              copy.actionServerId = e.currentTarget.value
              onUpdate(copy)
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
                  const copy = _.cloneDeep(action)
                  copy.name = e.target.value
                  onUpdate(copy)
                }}
              >
                {currentActionServer.actions.map(actionDefinition => (
                  <option key={actionDefinition.name} value={actionDefinition.name}>
                    {actionDefinition.name}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Action Parameters" labelFor="action-parameters">
              <ActionParameters
                parameterValues={currentActionDefinition.metadata.params.map(parameterDefinition => {
                  return { definition: parameterDefinition, value: action.parameters[parameterDefinition.name] || '' }
                })}
                onUpdate={parameterValues => {
                  const paramsObj = parameterValues.reduce((previousValue, parameterValue) => {
                    previousValue[parameterValue.definition.name] = parameterValue.value
                    return previousValue
                  }, {})

                  onUpdate({ ...action, parameters: paramsObj })
                }}
              />
            </FormGroup>
          </>
        )}

        {!currentActionDefinition && (
          <NonIdealState icon="warning-sign" title="No actions found on this Action Server" />
        )}

        <Button
          onClick={() => {
            onSave()
          }}
          disabled={!actionIsValid}
        >
          Save
        </Button>
      </div>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  actionServers: state.actionServers
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(ActionDialog)
