import { Button, FormGroup, HTMLSelect, Intent, NonIdealState } from '@blueprintjs/core'
import { ItemRenderer, Select } from '@blueprintjs/select'
import axios from 'axios'
import { ActionDefinition, ActionParameterDefinition, ActionServer, ActionServerWithActions } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { BaseDialog, DialogBody, DialogFooter, InfoTooltip } from '~/components/Shared/Interface'

import { Action, Parameters } from '../diagram/nodes_v2/ActionNode'

import style from './style.scss'
import { ActionParameters } from './ActionParameters'

export interface ParameterValue {
  definition: ActionParameterDefinition
  value: string
}

const ActionNameSelect: FC<{
  name: string
  actions: ActionDefinition[]
  onUpdate: (name: string) => void
}> = props => {
  const { name, actions, onUpdate } = props
  const ActionSelect = Select.ofType<ActionDefinition>()

  const ActionItemRenderer: ItemRenderer<ActionDefinition> = (item, { handleClick }) => {
    return (
      <div key={item.name} onClick={handleClick} className={style.actionSelectItem}>
        <div>
          <span className={style.category}>{item.category}</span> - {item.name}
        </div>
        <div className={style.description}>{item.description}</div>
      </div>
    )
  }

  return (
    <>
      <FormGroup label="Action to execute" labelFor="action-name">
        <ActionSelect
          items={actions}
          itemRenderer={ActionItemRenderer}
          onItemSelect={item => {
            onUpdate(item.name)
          }}
          filterable={false}
          popoverProps={{ minimal: true }}
        >
          <Button text={name} rightIcon="double-caret-vertical" />
        </ActionSelect>
      </FormGroup>
    </>
  )
}

const ActionParametersComponent: FC<{
  actionDefinitionParams: ActionParameterDefinition[]
  actionParams: Parameters
  onUpdate: (params: Parameters) => void
}> = props => {
  const { actionDefinitionParams, actionParams, onUpdate } = props
  return (
    <FormGroup
      label="Action Parameters"
      labelFor="action-parameters"
      helperText={actionDefinitionParams.length === 0 ? 'This action has no parameters' : undefined}
    >
      <div style={{ padding: 10 }}>
        <ActionParameters
          parameterValues={actionDefinitionParams.map(parameterDefinition => {
            return { definition: parameterDefinition, value: actionParams[parameterDefinition.name] || '' }
          })}
          onUpdate={parameterValues => {
            const paramsObj = parameterValues.reduce((previousValue, parameterValue) => {
              previousValue[parameterValue.definition.name] = parameterValue.value
              return previousValue
            }, {})

            onUpdate(paramsObj)
          }}
        />
      </div>
    </FormGroup>
  )
}

const ActionServers: FC<{
  actionServerId: string
  actionServers: ActionServer[]
  onUpdate: (actionServerId: string) => void
}> = props => {
  const { actionServerId, actionServers, onUpdate } = props
  return (
    <FormGroup
      label={
        <span style={{ display: 'flex' }}>
          <div className={style.actionServer}>Action Server</div>
          <InfoTooltip text="This is the action server on which the action will be executed"></InfoTooltip>
        </span>
      }
    >
      <HTMLSelect
        value={actionServerId}
        onChange={e => {
          e.preventDefault()
          onUpdate(e.target.value)
        }}
      >
        {actionServers.map(actionServer => (
          <option key={actionServer.id} value={actionServer.id}>
            {actionServer.id} ({actionServer.baseUrl})
          </option>
        ))}
      </HTMLSelect>
    </FormGroup>
  )
}

const ActionDialog: FC<{
  name: string
  parameters: Parameters
  actionServerId: string
  isOpen: boolean
  onClose: () => void
  onSave: (action: Action) => void
}> = props => {
  const { isOpen, onClose, onSave } = props

  const [actionServers, setActionServers] = useState<ActionServerWithActions[]>([])
  const [name, setName] = useState(props.name)
  const [parameters, setParameters] = useState(props.parameters)
  const [actionServerId, setActionServerId] = useState(props.actionServerId)
  const [opening, setOpening] = useState(false)
  const [errorFetchingServers, setErrorFetchingServers] = useState(false)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActionServers = async () => {
      try {
        const response = await axios.get(`${window.BOT_API_PATH}/actionServers`)
        setActionServers(response.data)
        setErrorFetchingServers(false)
      } catch (e) {
        setErrorFetchingServers(true)
      } finally {
        setLoading(false)
      }
    }

    if (opening) {
      // tslint:disable-next-line: no-floating-promises
      fetchActionServers()
    }
  }, [opening])

  const currentServer: ActionServerWithActions | undefined =
    actionServers.find(s => s.id === actionServerId) || actionServers[0]

  if (actionServerId === '' && currentServer) {
    setActionServerId(currentServer.id)
  }

  const hasActionsError = currentServer?.actions === undefined
  const hasActions = currentServer?.actions?.length > 0
  let actionDef: ActionDefinition | undefined

  if (hasActions) {
    actionDef = currentServer.actions.find(a => a.name === name) || currentServer.actions[0]
    if (name === '' && actionDef) {
      setName(actionDef.name)
    }
  }

  const isActionValid = !!name && !!actionServerId && !errorFetchingServers
  const closeDialog = () => {
    setOpening(false)
    setName(props.name)
    setParameters(props.parameters)
    setActionServerId(props.actionServerId)
    onClose()
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      title="Edit Action"
      icon="offline"
      onClose={closeDialog}
      onOpening={() => setOpening(true)}
    >
      <DialogBody hidden={!isLoading}>
        <div>Please wait, loading action servers...</div>
      </DialogBody>
      <DialogBody hidden={isLoading}>
        <div onMouseDown={e => e.stopPropagation()} onContextMenu={e => e.stopPropagation()}>
          {!errorFetchingServers && (
            <ActionServers
              actionServers={actionServers}
              actionServerId={actionServerId}
              onUpdate={actionServerId => {
                setActionServerId(actionServerId)
                const actionServer = actionServers.find(s => s.id === actionServerId)
                setName(actionServer.actions[0]?.name || '')
              }}
            />
          )}

          {errorFetchingServers && (
            <NonIdealState
              title="Could not retrieve action servers"
              description="There seems to be an error in your Botpress server. Please contact your administrator."
              icon="warning-sign"
            />
          )}

          {hasActionsError && (
            <NonIdealState
              title="Error listing actions from the action server"
              description="There was an error while trying to get the list of actions on the selected server"
              icon="warning-sign"
            />
          )}

          {!hasActionsError && !hasActions && (
            <NonIdealState icon="warning-sign" title="No actions found on this action server" />
          )}

          {actionDef && (
            <>
              <ActionNameSelect
                actions={currentServer.actions}
                name={actionDef.name}
                onUpdate={name => {
                  setName(name)
                }}
              />

              <ActionParametersComponent
                actionDefinitionParams={actionDef.params}
                actionParams={parameters}
                onUpdate={parameters => setParameters(parameters)}
              />
            </>
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button text="Cancel" id="btn-cancel" onClick={closeDialog} />
        <Button
          text="Save"
          intent={Intent.PRIMARY}
          onClick={() => onSave({ name, actionServerId, parameters })}
          disabled={!isActionValid || isLoading}
        />
      </DialogFooter>
    </BaseDialog>
  )
}

export default ActionDialog
