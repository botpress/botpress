import { Icon } from '@blueprintjs/core'
import _ from 'lodash'
import reject from 'lodash/reject'
import values from 'lodash/values'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { deleteFlow, duplicateFlow, renameFlow } from '~/actions'
import { history } from '~/components/Routes'
import { SearchBar, SidePanel, SidePanelSection } from '~/components/Shared/Interface'
import { getCurrentFlow, getDirtyFlows } from '~/reducers'

import Inspector from '../inspector'
import InspectorV2 from '../inspector_v2'

import FlowsList from './FlowsList'
import FlowNameModal from './FlowNameModal'
import FlowTools from './FlowTools'
import Toolbar from './Toolbar'
export type PanelPermissions = 'create' | 'rename' | 'delete'

type Props = {
  flowsNames: string[]
  onCreateFlow: (flowName: string) => void
  flows: any
  deleteFlow: (flowName: string) => void
  onDeleteSelectedElements: () => void
  renameFlow: any
  permissions: PanelPermissions[]
  dirtyFlows: any
  duplicateFlow: any
  currentFlow: any
  mutexInfo: string
  readOnly: boolean
  showFlowNodeProps: boolean
  layoutv2: boolean
}

const SidePanelContent: FC<Props> = props => {
  const [modalOpen, setModalOpen] = useState(false)
  const [flowName, setFlowName] = useState()
  const [flowAction, setFlowAction] = useState<any>('create')
  const [filter, setFilter] = useState()

  const goToFlow = flow => history.push(`/flows/${flow.replace(/\.flow\.json$/i, '')}`)

  const normalFlows = reject(props.flows, x => x.name.startsWith('skills/'))
  const flowsName = normalFlows.map(x => {
    return { name: x.name }
  })

  const createFlowAction = {
    id: 'btn-add-flow',
    icon: <Icon icon="add" />,
    key: 'create',
    tooltip: 'Create new flow',
    onClick: () => {
      setFlowAction('create')
      setModalOpen(true)
    }
  }

  const renameFlow = (flowName: string) => {
    setFlowName(flowName)
    setFlowAction('rename')
    setModalOpen(true)
  }

  const duplicateFlow = (flowName: string) => {
    setFlowName(flowName)
    setFlowAction('duplicate')
    setModalOpen(true)
  }

  return (
    <SidePanel>
      {!(props.showFlowNodeProps && props.layoutv2) && <Toolbar mutexInfo={props.mutexInfo} />}

      {props.showFlowNodeProps && !props.layoutv2 ? (
        <Inspector />
      ) : props.showFlowNodeProps && props.layoutv2 ? (
        <InspectorV2 onDeleteSelectedElements={props?.onDeleteSelectedElements} />
      ) : (
        <React.Fragment>
          <SearchBar icon="filter" placeholder="Filter flows" onChange={setFilter} />

          <SidePanelSection label={'Flows'} actions={props.permissions.includes('create') && [createFlowAction]}>
            <FlowsList
              readOnly={props.readOnly}
              canDelete={props.permissions.includes('delete')}
              canRename={props.permissions.includes('rename')}
              flows={flowsName}
              dirtyFlows={props.dirtyFlows}
              goToFlow={goToFlow}
              deleteFlow={props.deleteFlow}
              duplicateFlow={duplicateFlow}
              renameFlow={renameFlow}
              currentFlow={props.currentFlow}
              filter={filter}
            />
          </SidePanelSection>

          <SidePanelSection label="Tools">
            <FlowTools />
          </SidePanelSection>
        </React.Fragment>
      )}
      <FlowNameModal
        action={flowAction}
        originalName={flowName}
        flowsNames={props.flowsNames}
        isOpen={modalOpen}
        toggle={() => setModalOpen(!modalOpen)}
        onCreateFlow={props.onCreateFlow}
        onRenameFlow={props.renameFlow}
        onDuplicateFlow={props.duplicateFlow}
      />
    </SidePanel>
  )
}

const mapStateToProps = state => ({
  currentFlow: getCurrentFlow(state),
  flows: values(state.flows.flowsByName),
  dirtyFlows: getDirtyFlows(state),
  flowProblems: state.flows.flowProblems,
  flowsNames: _.keys(state.flows.flowsByName),
  showFlowNodeProps: state.flows.showFlowNodeProps,
  layoutv2: state.flows.layoutv2
})

const mapDispatchToProps = {
  deleteFlow,
  duplicateFlow,
  renameFlow
}

export default connect(mapStateToProps, mapDispatchToProps)(SidePanelContent)
