import { Icon } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import reject from 'lodash/reject'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { deleteFlow, duplicateFlow, renameFlow } from '~/actions'
import { history } from '~/components/Routes'
import { SearchBar, SidePanel, SidePanelSection } from '~/components/Shared/Interface'
import { getAllFlows, getCurrentFlow, getDirtyFlows, getFlowNamesList } from '~/reducers'

import Inspector from '../inspector'

import FlowNameModal from './FlowNameModal'
import FlowsList from './FlowsList'

export type PanelPermissions = 'create' | 'rename' | 'delete'

interface Props {
  flowsNames: string[]
  onCreateFlow: (flowName: string) => void
  flows: any
  deleteFlow: (flowName: string) => void
  renameFlow: any
  permissions: PanelPermissions[]
  dirtyFlows: any
  duplicateFlow: any
  currentFlow: any
  mutexInfo: string
  readOnly: boolean
  showFlowNodeProps: boolean
}

const SidePanelContent: FC<Props> = props => {
  const [modalOpen, setModalOpen] = useState(false)
  const [flowName, setFlowName] = useState<string>()
  const [flowAction, setFlowAction] = useState<any>('create')
  const [filter, setFilter] = useState<any>()

  const goToFlow = flow => history.push(`/flows/${flow.replace(/\.flow\.json$/i, '')}`)

  const normalFlows = reject(props.flows, x => x.name.startsWith('skills/'))
  const flowsName = normalFlows.map(x => {
    return { name: x.name }
  })

  const createFlowAction = {
    id: 'btn-add-flow',
    icon: <Icon icon="add" />,
    key: 'create',
    tooltip: lang.tr('studio.flow.sidePanel.createNewFlow'),
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
      <SidePanelSection
        label={lang.tr('flows')}
        actions={props.permissions.includes('create') && [createFlowAction]}
      >
        <SearchBar icon="filter" placeholder={lang.tr('studio.flow.sidePanel.filterFlows')} onChange={setFilter} />
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

const SidePanelInspectorContent: FC<Props> = props => {
  return (
    <SidePanel style={{
      position: 'absolute',
      right: 0,
      width: 240,
      zIndex: 1,
      paddingTop: 70,
      ...(!props.showFlowNodeProps && { width: 0 })
    }}>
      {props.showFlowNodeProps ? ( <Inspector /> ) : null}
    </SidePanel>
  )
}

const mapStateToProps = state => ({
  currentFlow: getCurrentFlow(state),
  flows: getAllFlows(state),
  dirtyFlows: getDirtyFlows(state),
  flowProblems: state.flows.flowProblems,
  flowsName: getFlowNamesList(state),
  showFlowNodeProps: state.flows.showFlowNodeProps
})

const mapDispatchToProps = {
  deleteFlow,
  duplicateFlow,
  renameFlow
}

const SidePanelInspector = connect(mapStateToProps, mapDispatchToProps)(SidePanelInspectorContent)

export default connect(mapStateToProps, mapDispatchToProps)(SidePanelContent)
export { SidePanelInspector }
