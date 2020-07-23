import { Button, FormGroup, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable } from 'botpress/sdk'
import { Dialog } from 'botpress/shared'
import { FlowView } from 'common/typings'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { fetchFlows, updateFlow } from '~/actions'
import { getCurrentFlow, RootReducer } from '~/reducers'

import VariableModal from './Modal'

interface OwnProps {}
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = StateProps & DispatchProps & OwnProps

const VariablesEditor: FC<Props> = props => {
  const [editingVariable, setEditingVariable] = useState<FlowVariable>(undefined)

  const affectUpdateFlow = async (flow: FlowView) => {
    props.updateFlow(flow)
  }

  const computeCreateVariable = (flow: FlowView, newVariable: FlowVariable) => {
    if (!flow.variables) {
      flow.variables = [newVariable]
    } else {
      flow.variables.push(newVariable)
    }
  }

  const computeDeleteVariable = (flow: FlowView, variableName: string) => {
    flow.variables = flow.variables.filter(v => v.name != variableName)
  }

  const computeEditVariable = (flow: FlowView, variableName: string, newValues: FlowVariable) => {
    const index = flow.variables.findIndex(v => v.name == variableName)
    flow.variables[index] = newValues
  }

  const handleCreateClick = async () => {
    const newVariable: FlowVariable = {
      type: 'string',
      name: `new-variable-${props.currentFlow?.variables?.length ?? 0}`
    }
    const flow = props.currentFlow
    computeCreateVariable(flow, newVariable)
    await affectUpdateFlow(flow)
  }

  const handleDeleteClick = async (variableName: string) => {
    const flow = props.currentFlow
    computeDeleteVariable(flow, variableName)
    await affectUpdateFlow(flow)
  }

  const handleEditClick = (variableName: string) => {
    setEditingVariable(props.currentFlow?.variables.find(v => v.name === variableName))
  }

  const handleModalSaveClick = async (newValues: FlowVariable) => {
    const flow = props.currentFlow
    computeEditVariable(flow, editingVariable.name, newValues)
    await affectUpdateFlow(flow)
  }

  const renderHead = () => {
    return (
      <div>
        <h2>Variables</h2>
        <Button text="Add" onClick={() => handleCreateClick()} />
      </div>
    )
  }

  const renderTable = () => {
    return (
      <table className="bp3-html-table bp3-html-table-striped bp3-html-table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>{renderTableRows()}</tbody>
      </table>
    )
  }
  const renderTableRows = () => {
    return (
      <Fragment>
        {props.currentFlow?.variables?.map((v, i) => (
          <tr key={i}>
            <td>{v.name}</td>
            <td>{v.type}</td>
            <td>
              <Button text="Edit" onClick={() => handleEditClick(v.name)} />
            </td>
            <td>
              <Button text="Delete" onClick={() => handleDeleteClick(v.name)} />
            </td>
          </tr>
        ))}
      </Fragment>
    )
  }

  const renderModal = () => {
    return (
      <VariableModal
        variable={editingVariable}
        saveChanges={x => handleModalSaveClick(x)}
        isOpen={editingVariable !== undefined}
        onClose={() => setEditingVariable(undefined)}
      />
    )
  }

  return (
    <div>
      {renderHead()}
      {renderTable()}
      {renderModal()}
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({ currentFlow: getCurrentFlow(state) })

const mapDispatchToProps = { fetchFlows, updateFlow }

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(VariablesEditor)
