import { Alignment, Button, Navbar, NavbarGroup, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import { lang, Tabs } from 'botpress/shared'
import { nextFlowName, nextTopicName } from 'common/flow'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import {
  createFlow,
  deleteFlow,
  duplicateFlow,
  fetchFlows,
  fetchTopics,
  refreshConditions,
  renameFlow,
  switchFlow,
  updateFlow
} from '~/actions'
import { history } from '~/components/Routes'
import { getAllFlows, getFlowNamesList, RootReducer } from '~/reducers'
import storage from '~/util/storage'

import Inspector from '../../FlowBuilder/inspector'

import style from './style.scss'
import Library from './Library'
import CreateTopicModal from './TopicEditor/CreateTopicModal'
import TopicList from './TopicList'

export type PanelPermissions = 'create' | 'rename' | 'delete'
const SIDEBAR_TAB_KEY = `bp::${window.BOT_ID}::sidebarTab`

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
  currentLang: string
  defaultLang: string
  mutexInfo: any
  selectedTopic: string
  selectedWorkflow: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = StateProps & DispatchProps & OwnProps

const SidePanelContent: FC<Props> = props => {
  const [createTopicOpen, setCreateTopicOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editing, setEditing] = useState<string>()
  const [isEditingNew, setIsEditingNew] = useState(false)
  const [currentTab, setCurrentTab] = useState(storage.get(SIDEBAR_TAB_KEY) || 'topics')

  useEffect(() => {
    props.refreshConditions()
    props.fetchTopics()
  }, [])

  const goToFlow = (flow?: string) => history.push(`/oneflow/${flow?.replace(/\.flow\.json/, '') ?? ''}`)

  const createWorkflow = (topicName: string) => {
    const fullName = nextFlowName(props.flows, topicName, 'Workflow')
    setEditing(fullName.replace('.flow.json', ''))
    setIsEditingNew(true)

    props.createFlow(fullName)
  }

  const createTopic = async () => {
    const name = nextTopicName(props.topics, 'Topic')

    setEditing(name)
    setIsEditingNew(true)

    await axios.post(`${window.BOT_API_PATH}/topic`, { name, description: undefined })
    props.fetchTopics()
  }

  const canDelete = props.permissions.includes('delete')
  const canAdd = !props.defaultLang || props.defaultLang === props.currentLang

  const onTabChanged = tabId => {
    setCurrentTab(tabId)
    storage.set(SIDEBAR_TAB_KEY, tabId)
  }

  const tabs = [
    {
      id: 'topics',
      title: lang.tr('topics')
    },
    {
      id: 'library',
      title: lang.tr('library')
    }
  ]

  return (
    <div className={style.sidePanel}>
      {props.showFlowNodeProps ? (
        <Inspector onDeleteSelectedElements={props?.onDeleteSelectedElements} />
      ) : (
        <React.Fragment>
          <Navbar className={style.topicsNavbar}>
            <Tabs currentTab={currentTab} tabChange={onTabChanged} tabs={tabs} />
            {props.permissions.includes('create') && currentTab === 'topics' && (
              <NavbarGroup align={Alignment.RIGHT}>
                {canAdd && (
                  <Tooltip content={lang.tr('studio.flow.sidePanel.addTopic')}>
                    <Button icon="plus" onClick={() => createTopic()} />
                  </Tooltip>
                )}
              </NavbarGroup>
            )}
          </Navbar>

          {currentTab === 'topics' && (
            <TopicList
              readOnly={props.readOnly}
              goToFlow={goToFlow}
              createWorkflow={createWorkflow}
              canDelete={canDelete}
              selectedTopic={props.selectedTopic}
              selectedWorkflow={props.selectedWorkflow}
              editing={editing}
              setEditing={setEditing}
              isEditingNew={isEditingNew}
              setIsEditingNew={setIsEditingNew}
              canAdd={canAdd}
            />
          )}

          {currentTab === 'library' && (
            <Library
              goToFlow={goToFlow}
              createWorkflow={createWorkflow}
              flows={props.flows}
              selectedWorkflow={props.selectedWorkflow}
              canAdd={canAdd}
            />
          )}
        </React.Fragment>
      )}

      <CreateTopicModal
        isOpen={createTopicOpen}
        toggle={() => setCreateTopicOpen(!createTopicOpen)}
        onCreateFlow={props.onCreateFlow}
      />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flows: getAllFlows(state),
  flowsName: getFlowNamesList(state),
  showFlowNodeProps: state.flows.showFlowNodeProps,
  topics: state.ndu.topics
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
  fetchFlows
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(SidePanelContent)
