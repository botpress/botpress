import { Icon } from '@blueprintjs/core'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import {
  deleteFlow,
  duplicateFlow,
  fetchFlows,
  fetchTopics,
  refreshConditions,
  renameFlow,
  switchFlow
} from '~/actions'
import { history } from '~/components/Routes'
import { SearchBar, SidePanel, SidePanelSection } from '~/components/Shared/Interface'
import { getAllFlows, getCurrentFlow, getFlowNamesList } from '~/reducers'

import Inspector from '../../FlowBuilder/inspector'
import Toolbar from '../../FlowBuilder/sidePanel/Toolbar'

import Library from './Library'
import { exportCompleteTopic } from './TopicEditor/export'
import CreateTopicModal from './TopicEditor/CreateTopicModal'
import EditTopicModal from './TopicEditor/EditTopicModal'
import ImportModal from './TopicEditor/ImportModal'
import TopicList from './TopicList'
import EditTopicQnAModal from './TopicQnAEditor/EditTopicQnAModal'
import WorkflowEditor from './WorkflowEditor'
import { exportCompleteWorkflow } from './WorkflowEditor/export'

export type PanelPermissions = 'create' | 'rename' | 'delete'

export enum ElementType {
  Topic = 'topic',
  Workflow = 'workflow',
  Content = 'content',
  Action = 'action',
  Intent = 'intent',
  Flow = 'flow',
  Knowledge = 'knowledge',
  Unknown = 'unknown'
}

interface OwnProps {
  onCreateFlow: (flowName: string) => void
  history: any
  permissions: PanelPermissions[]
  readOnly: boolean
}

interface StateProps {
  showFlowNodeProps: boolean
  flows: FlowView[]
  currentFlow: any
  dirtyFlows: any
  flowPreview: boolean
  mutexInfo: string
  topics: any
  flowsName: { name: string; label: string }[]
}

interface DispatchProps {
  refreshConditions: () => void
  fetchTopics: () => void
  fetchFlows: () => void
  deleteFlow: (flowName: string) => void
  switchFlow: (flowName: string) => void
  renameFlow: any
  duplicateFlow: any
}

type Props = StateProps & DispatchProps & OwnProps

const SidePanelContent: FC<Props> = props => {
  const [createTopicOpen, setCreateTopicOpen] = useState(false)
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [topicQnAModalOpen, setTopicQnAModalOpen] = useState(false)
  const [editWorkflowModalOpen, setEditWorkflowModalOpen] = useState(false)
  const [importWorkflowModalOpen, setImportWorkflowModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')

  const [topicFilter, setTopicFilter] = useState('')
  const [libraryFilter, setLibraryFilter] = useState('')

  useEffect(() => {
    props.refreshConditions()
    props.fetchTopics()
  }, [])

  const goToFlow = flow => history.push(`/oneflow/${flow.replace(/\.flow\.json/, '')}`)

  const createTopicAction = {
    id: 'btn-add-flow',
    icon: <Icon icon="add" />,
    key: 'create',
    tooltip: 'Create new topic',
    onClick: () => setCreateTopicOpen(true)
  }

  const importAction = {
    id: 'btn-import',
    icon: <Icon icon="import" />,
    key: 'import',
    tooltip: 'Import content',
    onClick: () => setImportModalOpen(true)
  }

  const editQnA = (topicName: string) => {
    setSelectedTopic(topicName)
    setTopicQnAModalOpen(true)
  }

  const editTopic = (topicName: string) => {
    setSelectedTopic(topicName)
    setTopicModalOpen(true)
  }

  const duplicateFlow = (flowName: string) => {}

  const editWorkflow = (workflowId: string, data) => {
    props.switchFlow(data.name)
    setSelectedTopic(data.name.split('/')[0])
    setSelectedWorkflow(workflowId)
    setEditWorkflowModalOpen(true)
  }

  const createWorkflow = (topicName: string) => {
    setSelectedTopic(topicName)
    setSelectedWorkflow('')
    setEditWorkflowModalOpen(true)
  }

  const downloadTextFile = (text, fileName) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([text], { type: `application/json` }))
    link.download = fileName
    link.click()
  }

  const exportTopic = async topicName => {
    const topic = await exportCompleteTopic(topicName, props.flows)
    downloadTextFile(JSON.stringify(topic), `${topicName}.json`)
  }

  const exportWorkflow = async name => {
    const workflow = await exportCompleteWorkflow(name)
    downloadTextFile(JSON.stringify(workflow), `${name}.json`)
  }

  const onImportCompleted = () => {
    props.fetchFlows()
    props.fetchTopics()
  }

  const topicActions = props.permissions.includes('create') && [importAction, createTopicAction]
  const importWorkflow = () => setImportWorkflowModalOpen(!importWorkflowModalOpen)
  const canDelete = props.permissions.includes('delete')

  return (
    <SidePanel>
      <Toolbar mutexInfo={props.mutexInfo} />

      {props.showFlowNodeProps ? (
        <Inspector />
      ) : (
        <React.Fragment>
          <SearchBar icon="filter" placeholder="Filter topics and workflows" onChange={setTopicFilter} />

          <SidePanelSection label="Topics" actions={topicActions}>
            <TopicList
              readOnly={props.readOnly}
              canDelete={canDelete}
              flows={props.flowsName}
              goToFlow={goToFlow}
              deleteFlow={props.deleteFlow}
              duplicateFlow={duplicateFlow}
              currentFlow={props.currentFlow}
              editWorkflow={editWorkflow}
              createWorkflow={createWorkflow}
              exportWorkflow={exportWorkflow}
              importWorkflow={importWorkflow}
              filter={topicFilter}
              editTopic={editTopic}
              editQnA={editQnA}
              topics={props.topics}
              exportTopic={exportTopic}
              fetchTopics={props.fetchTopics}
            />
          </SidePanelSection>

          <SidePanelSection label="Library">
            <SearchBar icon="filter" placeholder="Filter library" onChange={setLibraryFilter} />
            <Library filter={libraryFilter} />
          </SidePanelSection>
        </React.Fragment>
      )}

      <EditTopicModal
        selectedTopic={selectedTopic}
        isOpen={topicModalOpen}
        toggle={() => setTopicModalOpen(!topicModalOpen)}
      />

      <EditTopicQnAModal
        selectedTopic={selectedTopic}
        isOpen={topicQnAModalOpen}
        toggle={() => setTopicQnAModalOpen(!topicQnAModalOpen)}
      />

      <CreateTopicModal
        isOpen={createTopicOpen}
        toggle={() => setCreateTopicOpen(!createTopicOpen)}
        onCreateFlow={props.onCreateFlow}
      />

      <WorkflowEditor
        isOpen={editWorkflowModalOpen}
        toggle={() => setEditWorkflowModalOpen(!editWorkflowModalOpen)}
        selectedWorkflow={selectedWorkflow}
        selectedTopic={selectedTopic}
        readOnly={props.readOnly}
        canRename={props.permissions.includes('rename')}
      />

      <ImportModal
        isOpen={importModalOpen}
        toggle={() => setImportModalOpen(!importModalOpen)}
        onImportCompleted={onImportCompleted}
        selectedTopic={selectedTopic}
        flows={props.flows}
        topics={props.topics}
      />
    </SidePanel>
  )
}

const mapStateToProps = state => ({
  currentFlow: getCurrentFlow(state),
  flows: getAllFlows(state),
  flowsName: getFlowNamesList(state),
  showFlowNodeProps: state.flows.showFlowNodeProps,
  topics: state.ndu.topics
})

const mapDispatchToProps = {
  switchFlow,
  deleteFlow,
  duplicateFlow,
  renameFlow,
  refreshConditions,
  fetchTopics,
  fetchFlows
}

export default connect(mapStateToProps, mapDispatchToProps)(SidePanelContent)
