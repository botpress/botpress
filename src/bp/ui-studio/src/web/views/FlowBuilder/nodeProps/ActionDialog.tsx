import { Button, FormGroup, HTMLSelect, Intent, NonIdealState } from '@blueprintjs/core'
import { ItemRenderer, Select } from '@blueprintjs/select'
import axios from 'axios'
import { Dialog, lang } from 'botpress/shared'
import { ActionDefinition, ActionParameterDefinition, ActionServer, ActionServerWithActions } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { InfoTooltip } from '~/components/Shared/Interface'

import { ActionParameters } from './ActionParameters'
import style from './style.scss'

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]

export interface Parameters {
  [name: string]: string
}

export interface Action {
  name: string
  parameters: Parameters
  actionServerId: PropType<ActionServer, 'id'>
}

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
      <FormGroup label={lang.tr('studio.flow.node.actionToExecute')} labelFor="action-name">
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
      label={lang.tr('studio.flow.node.actionParameters')}
      labelFor="action-parameters"
      helperText={actionDefinitionParams.length === 0 ? lang.tr('studio.flow.node.hasNoParameters') : undefined}
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
          <div className={style.actionServer}>{lang.tr('studio.flow.node.actionServer')}</div>
          <InfoTooltip text={lang.tr('studio.flow.node.actionServerTooltip')}></InfoTooltip>
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
        const response = await axios.get(`${window.STUDIO_API_PATH}/actions/actionServers`)
        setActionServers(response.data)
        setErrorFetchingServers(false)
      } catch (e) {
        setErrorFetchingServers(true)
      } finally {
        setLoading(false)
      }
    }

    if (opening) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
    <Dialog.Wrapper
      isOpen={isOpen}
      title={lang.tr('studio.flow.node.editAction')}
      icon="offline"
      onClose={closeDialog}
      onOpening={() => setOpening(true)}
    >
      {!isLoading && (
        <Dialog.Body>
          <div>{lang.tr('studio.flow.node.loadingActionServer')}</div>
        </Dialog.Body>
      )}
      {isLoading && (
        <Dialog.Body>
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
                title={lang.tr('studio.flow.node.couldNotRetrieveActionServer')}
                description={lang.tr('studio.flow.node.errorInServer')}
                icon="warning-sign"
              />
            )}

            {hasActionsError && (
              <NonIdealState
                title={lang.tr('studio.flow.node.errorListingActions')}
                description={lang.tr('studio.flow.node.errorListingActionsMore')}
                icon="warning-sign"
              />
            )}

            {!hasActionsError && !hasActions && (
              <NonIdealState icon="warning-sign" title={lang.tr('studio.flow.node.noActionsFound')} />
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
        </Dialog.Body>
      )}

      <Dialog.Footer>
        <Button text={lang.tr('cancel')} id="btn-cancel" onClick={closeDialog} />
        <Button
          text={lang.tr('save')}
          intent={Intent.PRIMARY}
          onClick={() => onSave({ name, actionServerId, parameters })}
          disabled={!isActionValid || isLoading}
        />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default ActionDialog
