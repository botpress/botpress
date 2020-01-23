import { Icon } from '@blueprintjs/core'
import axios from 'axios'
import { Topic } from 'botpress/sdk'
import _ from 'lodash'
import reject from 'lodash/reject'
import values from 'lodash/values'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { deleteFlow, duplicateFlow, fetchTopics, refreshConditions, renameFlow } from '~/actions'
import { history } from '~/components/Routes'
import { SearchBar, SidePanel, SidePanelSection } from '~/components/Shared/Interface'
import { getCurrentFlow, getDirtyFlows } from '~/reducers'

import Inspector from '../../FlowBuilder/inspector'
import Toolbar from '../../FlowBuilder/SidePanel/Toolbar'

import EditGoalModal from './GoalEditor'
import { exportCompleteGoal } from './GoalEditor/export'
import ImportGoalModal from './GoalEditor/ImportGoalModal'
import Library from './Library'
import { exportCompleteTopic } from './TopicEditor/export'
import CreateTopicModal from './TopicEditor/CreateTopicModal'
import EditTopicModal from './TopicEditor/EditTopicModal'
import ImportTopicModal from './TopicEditor/ImportTopicModal'
import TopicList from './TopicList'

export type PanelPermissions = 'create' | 'rename' | 'delete'

interface OwnProps {
  onCreateFlow: (flowName: string) => void
  history: any
  permissions: PanelPermissions[]
  readOnly: boolean
}

interface StateProps {
  flowsNames: string[]
  showFlowNodeProps: boolean
  flows: any
  currentFlow: any
  dirtyFlows: any
  flowPreview: boolean
  mutexInfo: string
  topics: any
}

interface DispatchProps {
  refreshConditions: () => void
  fetchTopics: () => void
  deleteFlow: (flowName: string) => void
  renameFlow: any
  duplicateFlow: any
}

type Props = StateProps & DispatchProps & OwnProps

const SidePanelContent: FC<Props> = props => {
  const [createTopicOpen, setCreateTopicOpen] = useState(false)
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [importGoalModalOpen, setImportGoalModalOpen] = useState(false)
  const [importTopicModalOpen, setImportTopicModalOpen] = useState(false)

  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')

  const [goalFilter, setGoalFilter] = useState('')
  const [libraryFilter, setLibraryFilter] = useState('')

  useEffect(() => {
    props.refreshConditions()
    props.fetchTopics()
  }, [])

  const goToFlow = flow => history.push(`/oneflow/${flow.replace(/\.flow\.json/, '')}`)

  const normalFlows = reject(props.flows, x => x.name.startsWith('skills/'))
  const flowsName = normalFlows.map(x => ({ name: x.name, label: x.label }))

  const createTopicAction = {
    id: 'btn-add-flow',
    icon: <Icon icon="cube-add" />,
    key: 'create',
    tooltip: 'Create new topic',
    onClick: () => setCreateTopicOpen(true)
  }

  const importTopicAction = {
    id: 'btn-import-topic',
    icon: <Icon icon="download" />,
    key: 'import',
    tooltip: 'Import existing topic',
    onClick: () => setImportTopicModalOpen(true)
  }

  const editTopic = (topicName: string) => {
    setSelectedTopic(topicName)
    setTopicModalOpen(true)
  }

  const duplicateFlow = (flowName: string) => {}

  const editGoal = (goalId: string) => {
    setSelectedGoal(goalId)
    setGoalModalOpen(!goalModalOpen)
  }

  const createGoal = (topicName: string) => {
    setSelectedTopic(topicName)
    setSelectedGoal('')
    setGoalModalOpen(true)
  }

  const updateTopics = async (topics: Topic[]) => {
    await axios.post(`${window.BOT_API_PATH}/mod/ndu/topics`, topics)
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

  const exportGoal = async goalName => {
    const goal = await exportCompleteGoal(goalName)
    downloadTextFile(JSON.stringify(goal), `${goalName}.json`)
  }

  return (
    <SidePanel>
      <Toolbar mutexInfo={props.mutexInfo} />

      {props.showFlowNodeProps ? (
        <Inspector />
      ) : (
        <React.Fragment>
          <SearchBar icon="filter" placeholder="Filter topics and goals" onChange={setGoalFilter} />

          <SidePanelSection
            label="Topics"
            actions={props.permissions.includes('create') && [createTopicAction, importTopicAction]}
          >
            <TopicList
              readOnly={props.readOnly}
              canDelete={props.permissions.includes('delete')}
              flows={flowsName}
              goToFlow={goToFlow}
              deleteFlow={props.deleteFlow}
              duplicateFlow={duplicateFlow}
              currentFlow={props.currentFlow}
              editGoal={editGoal}
              createGoal={createGoal}
              exportGoal={exportGoal}
              importGoal={() => setImportGoalModalOpen(!importGoalModalOpen)}
              filter={goalFilter}
              editTopic={editTopic}
              exportTopic={exportTopic}
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
        onDuplicateFlow={props.duplicateFlow}
        onRenameFlow={props.renameFlow}
        topics={props.topics}
        updateTopics={updateTopics}
      />

      <CreateTopicModal
        isOpen={createTopicOpen}
        toggle={() => setCreateTopicOpen(!createTopicOpen)}
        onCreateFlow={props.onCreateFlow}
        topics={props.topics}
        updateTopics={updateTopics}
      />

      <EditGoalModal
        isOpen={goalModalOpen}
        toggle={() => setGoalModalOpen(!goalModalOpen)}
        selectedGoal={selectedGoal}
        selectedTopic={selectedTopic}
        readOnly={props.readOnly}
        canRename={props.permissions.includes('rename')}
      />

      <ImportGoalModal
        isOpen={importGoalModalOpen}
        toggle={() => setImportGoalModalOpen(!importGoalModalOpen)}
        onImportCompleted={() => {}}
        flows={props.flows}
      />

      <ImportTopicModal
        isOpen={importTopicModalOpen}
        toggle={() => setImportTopicModalOpen(!importTopicModalOpen)}
        onImportCompleted={() => {}}
        flows={props.flows}
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
  topics: state.ndu.topics
})

const mapDispatchToProps = {
  deleteFlow,
  duplicateFlow,
  renameFlow,
  refreshConditions,
  fetchTopics
}

export default connect(mapStateToProps, mapDispatchToProps)(SidePanelContent)
