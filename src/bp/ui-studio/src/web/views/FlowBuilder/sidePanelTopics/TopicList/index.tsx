import { Button, Intent, MenuItem } from '@blueprintjs/core'
import axios from 'axios'
import { confirmDialog, EmptyState, lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { deleteFlow, fetchFlows, fetchTopics, renameFlow, updateFlow } from '~/actions'
import { SearchBar } from '~/components/Shared/Interface'
import { getCurrentFlow, getFlowNamesList, RootReducer } from '~/reducers'
import { sanitizeName } from '~/util'

import { buildFlowName } from '..//WorkflowEditor/utils'

import EmptyStateIcon from './EmptyStateIcon'
import style from './style.scss'
import TreeItem from './TreeItem'

const lockedFlows = ['misunderstood.flow.json', 'error.flow.json', 'workflow_ended.flow.json']

export const TYPE_TOPIC = 'topic'
export const TYPES = {
  Topic: 'topic',
  Workflow: 'workflow',
  Folder: 'folder'
}

export interface CountByTopic {
  [topicName: string]: number
}

interface OwnProps {
  readOnly: boolean
  qnaCountByTopic: CountByTopic[]
  goToFlow: (flow: any) => void
  createWorkflow: (topicId: string) => void
  editQnA: (topicName: string) => void
  exportTopic: (topicName: string | NodeData) => void
  canDelete: boolean
  editing: string
  setEditing: (name: string) => void
  isEditingNew: boolean
  setIsEditingNew: (val: boolean) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = StateProps & DispatchProps & OwnProps

interface NodeData {
  name: string
  type?: NodeType
  label?: string
  id?: any
  icon?: string
  triggerCount?: number
  topic?: string
  /** List of workflows which have a reference to it */
  referencedIn?: string[]
}

type NodeType = 'workflow' | 'folder' | 'topic' | 'qna' | 'addWorkflow'

const TopicList: FC<Props> = props => {
  const { editing, setEditing, isEditingNew, setIsEditingNew } = props
  const [filter, setFilter] = useState('')
  const [flows, setFlows] = useState<NodeData[]>([])
  const [forcedSelect, setForcedSelect] = useState(false)
  const [expanded, setExpanded] = useState<any>({})

  const filterByText = item => item.name.toLowerCase().includes(filter.toLowerCase())

  useEffect(() => {
    const qna = props.topics.filter(filterByText).map(topic => ({
      name: `${topic.name}/qna`,
      label: lang.tr('module.qna.fullName'),
      type: 'qna' as NodeType,
      icon: 'chat'
    }))

    setFlows([...qna, ...props.flowsName.filter(filterByText)])
  }, [props.flowsName, filter, props.topics, props.qnaCountByTopic])

  useEffect(() => {
    if (!forcedSelect && props.currentFlow) {
      const splitPath = props.currentFlow.location.split('/')
      setExpanded({ [splitPath.length > 1 ? splitPath[0] : 'default']: true })
      setForcedSelect(true)
    }
  }, [props.currentFlow])

  const deleteFlow = async (name: string, skipDialog = false) => {
    if (
      skipDialog ||
      (await confirmDialog(lang.tr('studio.flow.topicList.confirmDeleteFlow'), { acceptLabel: lang.tr('delete') }))
    ) {
      props.deleteFlow(name)
    }
  }

  const deleteTopic = async (name: string, skipDialog = false) => {
    const matcher = new RegExp(`^${name}/`)
    const flowsToDelete = props.flowsName.filter(x => matcher.test(x.name))

    if (
      skipDialog ||
      (await confirmDialog(
        <span>
          {lang.tr('studio.flow.topicList.confirmDeleteTopic')}
          <br />
          <br />
          {!!flowsToDelete.length && (
            <Fragment>
              {lang.tr('studio.flow.topicList.flowsAssociatedDelete', {
                warning: <strong>{lang.tr('studio.flow.topicList.bigWarning')}</strong>,
                count: flowsToDelete.length
              })}
            </Fragment>
          )}
        </span>,
        { acceptLabel: lang.tr('delete') }
      ))
    ) {
      await axios.post(`${window.STUDIO_API_PATH}/topics/deleteTopic/${name}`)
      flowsToDelete.forEach(flow => props.deleteFlow(flow.name))
      props.fetchTopics()
    }
  }

  const sanitize = (name: string) => {
    return sanitizeName(name).replace(/\//g, '-')
  }

  const handleContextMenu = (element: NodeData, isTopic: boolean, path: string) => {
    if (isTopic) {
      const folder = element.id
      if (folder === 'default') {
        return null
      }

      return (
        <Fragment>
          <MenuItem
            id="btn-edit"
            label={lang.tr('studio.flow.sidePanel.renameTopic')}
            onClick={() => {
              setEditing(path)
              setIsEditingNew(false)
            }}
          />
          <MenuItem
            id="btn-export"
            disabled={props.readOnly}
            label={lang.tr('studio.flow.topicList.exportTopic')}
            onClick={() => props.exportTopic(folder)}
          />
          <MenuItem
            id="btn-delete"
            label={lang.tr('studio.flow.topicList.deleteTopic')}
            intent={Intent.DANGER}
            onClick={() => deleteTopic(folder)}
          />
        </Fragment>
      )
    } else if (element.type === 'qna') {
      const { name } = element as NodeData

      return (
        <Fragment>
          <MenuItem
            id="btn-edit"
            disabled={props.readOnly}
            icon="edit"
            label={lang.tr('edit')}
            onClick={() => props.editQnA(name.replace('/qna', ''))}
          />
        </Fragment>
      )
    } else {
      const { name } = element as NodeData

      return (
        <Fragment>
          <MenuItem
            id="btn-edit"
            disabled={props.readOnly}
            label={lang.tr('studio.flow.sidePanel.renameWorkflow')}
            onClick={() => {
              setEditing(path)
              setIsEditingNew(false)
            }}
          />
          <MenuItem
            id="btn-delete"
            disabled={lockedFlows.includes(name) || !props.canDelete || props.readOnly}
            label={lang.tr('delete')}
            intent={Intent.DANGER}
            onClick={() => deleteFlow(name)}
          />
        </Fragment>
      )
    }
  }

  const newFlows = {}

  for (const workflow of flows) {
    const splitPath = workflow.name.split('/')
    const nodeLabel = splitPath.pop().replace('.flow.json', '')
    // TODO refactor and use existing utils for that https://github.com/botpress/botpress/pull/3272/files#diff-13a273103517c41a0c7dfec1c06f75b3

    if (!splitPath.length) {
      if (!newFlows['default']) {
        newFlows['default'] = {
          type: 'default',
          id: 'default',
          label: lang.tr('studio.flow.topicList.defaultWorkflows'),
          children: {
            [nodeLabel]: { ...workflow, id: workflow.name }
          }
        }
      } else {
        newFlows['default'].children[nodeLabel] = { ...workflow, id: workflow.name }
      }
    }

    splitPath.reduce((acc, parent, index) => {
      if (!acc[parent]) {
        acc[parent] = { id: parent, children: {} }
      }

      if (index === splitPath.length - 1) {
        if (acc[parent].children[nodeLabel]) {
          acc[parent].children[nodeLabel] = {
            ...acc[parent].children[nodeLabel],
            ...workflow,
            topic: splitPath.join('/'),
            id: nodeLabel
          }
        } else {
          acc[parent].children[nodeLabel] = { ...workflow, id: nodeLabel, topic: splitPath.join('/'), children: {} }
        }
      }

      return acc[parent].children
    }, newFlows)
  }

  const sortItems = flows => {
    return flows.sort((a, b) => {
      const aItem = a.id.toUpperCase()
      const bItem = b.id.toUpperCase()
      if (a.type === 'default' || b.type === 'qna') {
        return 1
      }
      if (a.type === 'qna' || b.type === 'default') {
        return -1
      }
      if (aItem < bItem) {
        return -1
      }
      if (aItem > bItem) {
        return 1
      }
      return 0
    })
  }

  const getFlattenFlows = (flows): any => {
    return sortItems(Object.values(flows)).reduce((acc: any, flow: any): any => {
      acc.push({ ...flow, children: flow.children ? getFlattenFlows(flow.children) : [] })

      return acc
    }, [])
  }

  const handleClick = ({ path, isTopic, ...item }): void => {
    if (item.children.length) {
      setExpanded({ ...expanded, [path]: !expanded[path] })
    }

    if (!isTopic) {
      props.goToFlow(item.name)
    }
  }

  const handleSave = async (item, isTopic: boolean, value: string) => {
    setEditing(undefined)
    setIsEditingNew(false)

    if (isTopic) {
      if (value !== item.id && !props.topics.find(x => x.name === value)) {
        await axios.post(`${window.STUDIO_API_PATH}/topics/${item.id}`, {
          name: value,
          description: undefined
        })

        if (expanded[item.id]) {
          setExpanded({ ...expanded, [item.id]: false, [value]: true })
        }

        await props.fetchFlows()
        await props.fetchTopics()
        props.goToFlow(props.currentFlow?.location.replace(item.id, value))
      }
    } else if (value !== (item.name || item.id)) {
      const fullName = buildFlowName({ topic: item.topic, workflow: sanitize(value) }, true)

      if (!props.flowsName.find(x => x.name === fullName)) {
        props.renameFlow({ targetFlow: item.name, name: fullName })
        props.updateFlow({ name: fullName })
      }
    }
  }

  const printTree = (item, level, parentId = '') => {
    const hasChildren = !!item.children.length
    const path = `${parentId}${parentId && '/'}${item.id}`
    const isTopic = level === 0

    return (
      <div className={cx(item.type, { empty: isEmpty })} key={path}>
        <TreeItem
          className={cx(style.treeItem, {
            [style.isTopic]: isTopic,
            [style.active]: item.name === props.currentFlow?.name
          })}
          isExpanded={expanded[path]}
          item={item}
          level={level}
          isEditing={editing === path}
          isEditingNew={isEditingNew}
          onSave={value => handleSave(item, isTopic, value)}
          contextMenuContent={handleContextMenu(item, isTopic, path)}
          onDoubleClick={() => (item.type === 'qna' ? props.editQnA(item.name.replace('/qna', '')) : null)}
          onClick={() => handleClick({ ...item, isTopic, path })}
          qnaCount={props.qnaCountByTopic?.[item.id] || 0}
        />
        {expanded[path] && (
          <Fragment>
            {hasChildren && item.children.map(child => printTree(child, level + 1, path))}
            {isTopic && item.id !== 'default' && (
              <Button
                minimal
                onClick={() => props.createWorkflow(item.id)}
                icon="plus"
                className={style.addBtn}
                text={lang.tr('studio.flow.sidePanel.addWorkflow')}
              />
            )}
          </Fragment>
        )}
      </div>
    )
  }

  const newFlowsAsArray = getFlattenFlows(newFlows)
  const isEmpty = !newFlowsAsArray.filter(item => item.type !== 'default').length

  return (
    <div className={cx(style.tree)}>
      {!!(!isEmpty || filter.length) && (
        <SearchBar
          className={style.searchBar}
          placeholder={lang.tr('studio.flow.sidePanel.filterTopicsAndWorkflows')}
          onChange={setFilter}
        />
      )}
      {isEmpty && (
        <EmptyState
          className={style.emptyState}
          icon={<EmptyStateIcon />}
          text={lang.tr('studio.flow.sidePanel.tapIconsToAdd')}
        />
      )}
      {getFlattenFlows(newFlows).map(item => printTree(item, 0))}
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flowsName: getFlowNamesList(state),
  topics: state.ndu.topics,
  currentFlow: getCurrentFlow(state)
})

const mapDispatchToProps = {
  fetchTopics,
  fetchFlows,
  renameFlow,
  updateFlow,
  deleteFlow
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(TopicList)
