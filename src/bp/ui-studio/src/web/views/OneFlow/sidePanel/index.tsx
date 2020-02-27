import { Icon } from '@blueprintjs/core'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import reject from 'lodash/reject'
import values from 'lodash/values'
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
import { getCurrentFlow, getDirtyFlows } from '~/reducers'

import Inspector from '../../FlowBuilder/inspector'
import Toolbar from '../../FlowBuilder/sidePanel/Toolbar'

import EditGoalModal from './GoalEditor'
import { exportCompleteGoal } from './GoalEditor/export'
import Library from './Library'
import { exportCompleteTopic } from './TopicEditor/export'
import CreateTopicModal from './TopicEditor/CreateTopicModal'
import EditTopicModal from './TopicEditor/EditTopicModal'
import ImportModal from './TopicEditor/ImportModal'
import TopicList from './TopicList'

export type PanelPermissions = 'create' | 'rename' | 'delete'

export enum ElementType {
  Topic = 'topic',
  Goal = 'goal',
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
  flowsNames: string[]
  showFlowNodeProps: boolean
  flows: FlowView[]
  currentFlow: any
  dirtyFlows: any
  flowPreview: boolean
  mutexInfo: string
  topics: any
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
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [importGoalModalOpen, setImportGoalModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')

  const [goalFilter, setGoalFilter] = useState('')
  const [libraryFilter, setLibraryFilter] = useState('')

  useEffect(() => {
    props.refreshConditions()
    props.fetchTopics()
  }, [])

  const goToFlow = flow => history.push(`/oneflow/${flow.replace(/\.flow\.json/, '')}`)

  const normalFlows = reject(props.flows, x => x.name && x.name.startsWith('skills/'))
  const flowsName = normalFlows.map(x => ({ name: x.name, label: x.label }))

  const createTopicAction = {
    id: 'btn-add-flow',
    icon: <Icon icon="cube-add" />,
    key: 'create',
    tooltip: 'Create new topic',
    onClick: () => setCreateTopicOpen(true)
  }

  const importAction = {
    id: 'btn-import',
    icon: <Icon icon="download" />,
    key: 'import',
    tooltip: 'Import content',
    onClick: () => setImportModalOpen(true)
  }

  const editTopic = (topicName: string) => {
    setSelectedTopic(topicName)
    setTopicModalOpen(true)
  }

  const duplicateFlow = (flowName: string) => {}

  const editGoal = (goalId: string, data) => {
    props.switchFlow(data.name)
    setSelectedTopic(data.name.split('/')[0])
    setSelectedGoal(goalId)
    setGoalModalOpen(!goalModalOpen)
  }

  const createGoal = (topicName: string) => {
    setSelectedTopic(topicName)
    setSelectedGoal('')
    setGoalModalOpen(true)
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

  const onImportCompleted = () => {
    props.fetchFlows()
    props.fetchTopics()
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
            actions={props.permissions.includes('create') && [createTopicAction, importAction]}
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
      />

      <CreateTopicModal
        isOpen={createTopicOpen}
        toggle={() => setCreateTopicOpen(!createTopicOpen)}
        onCreateFlow={props.onCreateFlow}
      />

      <EditGoalModal
        isOpen={goalModalOpen}
        toggle={() => setGoalModalOpen(!goalModalOpen)}
        selectedGoal={selectedGoal}
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
  flows: values(state.flows.flowsByName),
  dirtyFlows: getDirtyFlows(state),
  flowProblems: state.flows.flowProblems,
  flowsNames: _.keys(state.flows.flowsByName),
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
