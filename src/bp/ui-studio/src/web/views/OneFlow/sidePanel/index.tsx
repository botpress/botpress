import { Alignment, Button, Icon, Navbar, NavbarGroup, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import {
  createFlow,
  deleteFlow,
  duplicateFlow,
  fetchFlows,
  fetchTopics,
  getQnaCountByTopic,
  refreshConditions,
  renameFlow,
  switchFlow,
  updateFlow
} from '~/actions'
import { history } from '~/components/Routes'
import { SearchBar, SidePanel, SidePanelSection } from '~/components/Shared/Interface'
import { getAllFlows, getCurrentFlow, getFlowNamesList, RootReducer } from '~/reducers'

import Inspector from '../../FlowBuilder/inspector'
import Toolbar from '../../FlowBuilder/sidePanel/Toolbar'

import style from './style.scss'
import Library from './Library'
import { exportCompleteTopic } from './TopicEditor/export'
import CreateTopicModal from './TopicEditor/CreateTopicModal'
import EditTopicModal from './TopicEditor/EditTopicModal'
import ImportModal from './TopicEditor/ImportModal'
import TopicList, { CountByTopic } from './TopicList'
import EditTopicQnAModal from './TopicQnAEditor/EditTopicQnAModal'
import WorkflowEditor from './WorkflowEditor'
import { exportCompleteWorkflow } from './WorkflowEditor/export'
import { buildFlowName } from './WorkflowEditor/utils'

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
  onDeleteSelectedElements: () => void
  history: any
  permissions: PanelPermissions[]
  readOnly: boolean
  mutexInfo: any
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

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

  const [currentTab, setCurrentTab] = useState('topics')
  const [focusedText, setFocusedText] = useState('')
  const [newPath, setNewPath] = useState('')

  const [expandedPaths, setExpandedPaths] = useState<string[]>([])

  useEffect(() => {
    props.refreshConditions()
    props.fetchTopics()
    props.getQnaCountByTopic()
  }, [])

  const goToFlow = flow => history.push(`/oneflow/${flow.replace(/\.flow\.json/, '')}`)

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
    const originalName = 'Workflow'
    let name = originalName
    let fullName = buildFlowName({ topic: topicName, workflow: name }, true)
    let index = 0
    while (props.flows.find(f => f.name === fullName)) {
      index++
      name = `${originalName} ${index}`
      fullName = buildFlowName({ topic: topicName, workflow: name }, true)
    }

    setFocusedText(fullName)
    setNewPath(fullName)
    props.createFlow(fullName)
  }

  const createTopic = async () => {
    const originalName = 'Topic'
    let name = originalName
    let index = 0
    while (props.topics.find(t => t.name === name)) {
      index++
      name = `${originalName} ${index}`
    }

    await axios.post(`${window.BOT_API_PATH}/topic`, { name, description: undefined })
    setNewPath(name)
    setFocusedText(name)
    onExpandToggle(name, true)
    props.fetchTopics()
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

  const toggleQnaModal = () => {
    // TODO: only update when dirty
    if (topicQnAModalOpen) {
      props.getQnaCountByTopic()
    }

    setTopicQnAModalOpen(!topicQnAModalOpen)
  }

  const importWorkflow = () => setImportWorkflowModalOpen(!importWorkflowModalOpen)
  const canDelete = props.permissions.includes('delete')

  const onTabChanged = tabId => {
    setCurrentTab(tabId)
  }

  const onExpandToggle = (path, isExpanded) => {
    if (isExpanded) {
      setExpandedPaths([path, ...expandedPaths])
    } else {
      setExpandedPaths(expandedPaths.filter(x => x !== path))
    }
  }

  return (
    <div className={style.sidePanel}>
      {props.showFlowNodeProps ? (
        <Inspector onDeleteSelectedElements={props?.onDeleteSelectedElements} />
      ) : (
        <React.Fragment>
          <Navbar className={style.topicsNavbar}>
            <NavbarGroup>
              <Tabs onChange={onTabChanged}>
                <Tab id="topics" title={lang.tr('topics')} />
                <Tab id="library" title={lang.tr('library')} />
              </Tabs>
            </NavbarGroup>
            {props.permissions.includes('create') && currentTab === 'topics' && (
              <NavbarGroup align={Alignment.RIGHT}>
                <Tooltip content={lang.tr('studio.flow.sidePanel.importTopic')}>
                  <Button icon="import" onClick={() => setImportModalOpen(true)} />
                </Tooltip>
                <Tooltip content={lang.tr('studio.flow.sidePanel.addTopic')}>
                  <Button icon="plus" onClick={() => createTopic()} />
                </Tooltip>
              </NavbarGroup>
            )}
          </Navbar>

          {currentTab === 'topics' && (
            <React.Fragment>
              <SearchBar
                icon="filter"
                placeholder={lang.tr('studio.flow.sidePanel.filterTopicsAndWorkflows')}
                onChange={setTopicFilter}
              />
              <TopicList
                readOnly={props.readOnly}
                qnaCountByTopic={props.qnaCountByTopic}
                goToFlow={goToFlow}
                duplicateFlow={duplicateFlow}
                editWorkflow={editWorkflow}
                createWorkflow={createWorkflow}
                exportWorkflow={exportWorkflow}
                importWorkflow={importWorkflow}
                editTopic={editTopic}
                editQnA={editQnA}
                exportTopic={exportTopic}
                onExpandToggle={onExpandToggle}
                canDelete={canDelete}
                filter={topicFilter}
                expandedPaths={expandedPaths}
                newPath={newPath}
                setNewPath={setNewPath}
                focusedText={focusedText}
                setFocusedText={x => {
                  setFocusedText(x)
                  props.fetchTopics()
                }}
              />
            </React.Fragment>
          )}

          {currentTab === 'library' && <Library filter={libraryFilter} />}
        </React.Fragment>
      )}

      <EditTopicModal
        selectedTopic={selectedTopic}
        isOpen={topicModalOpen}
        toggle={() => setTopicModalOpen(!topicModalOpen)}
      />

      <EditTopicQnAModal selectedTopic={selectedTopic} isOpen={topicQnAModalOpen} toggle={toggleQnaModal} />

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
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flows: getAllFlows(state),
  flowsName: getFlowNamesList(state),
  showFlowNodeProps: state.flows.showFlowNodeProps,
  topics: state.ndu.topics,
  qnaCountByTopic: state.ndu.qnaCountByTopic
})

const mapDispatchToProps = {
  createFlow,
  switchFlow,
  deleteFlow,
  duplicateFlow,
  renameFlow,
  updateFlow,
  refreshConditions,
  fetchTopics,
  fetchFlows,
  getQnaCountByTopic
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(SidePanelContent)
