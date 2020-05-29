import { Button, EditableText, Intent, Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import axios from 'axios'
import { confirmDialog, EmptyState, lang, TreeView } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useState } from 'react'
import { connect } from 'react-redux'
import { deleteFlow, fetchFlows, fetchTopics, renameFlow, updateFlow } from '~/actions'
import { getCurrentFlow, getFlowNamesList, RootReducer } from '~/reducers'
import { sanitizeName } from '~/util'

import { buildFlowName } from '..//WorkflowEditor/utils'

import style from './style.scss'
import EmptyStateIcon from './EmptyStateIcon'
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
  duplicateFlow: (flowName: string) => void
  editWorkflow: (wfId: any, data: any) => void
  createWorkflow: (topicId: string) => void
  exportWorkflow: (flowName: string) => void
  importWorkflow: (topicId: string) => void
  editTopic: (topicName: string | NodeData) => void
  editQnA: (topicName: string) => void
  exportTopic: (topicName: string | NodeData) => void
  onExpandToggle: (node, isExpanded: boolean) => void
  canDelete: boolean
  filter: string
  expandedPaths: string[]
  newPath: string
  setNewPath: (path: string) => void
  focusedText: string
  setFocusedText: (name: string) => void
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
  countByTopic?: CountByTopic
}

type NodeType = 'workflow' | 'folder' | 'topic' | 'qna' | 'addWorkflow'

const TopicList: FC<Props> = props => {
  const [flows, setFlows] = useState<NodeData[]>([])
  const [forcedSelect, setForcedSelect] = useState(false)
  const [expanded, setExpanded] = useState<any>({})
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  useEffect(() => {
    const qna = props.topics.map(topic => ({
      name: `${topic.name}/qna`,
      label: lang.tr('module.qna.fullName'),
      type: 'qna' as NodeType,
      icon: 'chat',
      countByTopic: props.qnaCountByTopic?.[topic.name] || 0
    }))

    setFlows([...qna, ...props.flowsName])
  }, [props.flowsName, props.topics, props.qnaCountByTopic])

  useEffect(() => {
    if (!forcedSelect && props.currentFlow) {
      const splitPath = props.currentFlow.location.split('/')
      props.onExpandToggle(splitPath[0], true)
      setExpanded({ [splitPath.length > 1 ? splitPath[0] : 'default']: true })
      setForcedSelect(true)
    }
  }, [props.currentFlow])

  const deleteFlow = async (name: string, skipDialog = false) => {
    if (skipDialog || (await confirmDialog(lang.tr('studio.flow.topicList.confirmDeleteFlow', { name }), {}))) {
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
          {lang.tr('studio.flow.topicList.confirmDeleteTopic', { name })}
          <br />
          <br />
          {!!flowsToDelete.length && (
            <>
              {lang.tr('studio.flow.topicList.flowsAssociatedDelete', {
                warning: <strong>{lang.tr('studio.flow.topicList.bigWarning')}</strong>,
                count: flowsToDelete.length
              })}
            </>
          )}
        </span>,
        {}
      ))
    ) {
      await axios.post(`${window.BOT_API_PATH}/deleteTopic/${name}`)
      flowsToDelete.forEach(flow => props.deleteFlow(flow.name))
      props.fetchTopics()
    }
  }

  const sanitize = (name: string) => {
    return sanitizeName(name).replace(/\//g, '-')
  }

  /*const folderRenderer = (folder: string) => {
    const isFocused = folder === props.focusedText
    const isNew = folder === props.newPath
    const isBuiltIn = folder === 'Built-In'
    const filterOrder = isBuiltIn ? 3 : isNew ? 2 : 1

    const editTopic = async newName => {
      props.setFocusedText(undefined)
      props.setNewPath(undefined)
      setForceSelect(undefined)
      if (newName === '') {
        await props.fetchFlows()
        await props.fetchTopics()
      } else if (newName !== folder) {
        const sanitizedName = sanitize(newName)
        if (!props.topics.find(x => x.name == sanitizedName)) {
          await axios.post(`${window.BOT_API_PATH}/topic/${folder}`, { name: sanitizedName, description: undefined })
          if (props.expandedPaths.includes(folder)) {
            props.onExpandToggle(sanitizedName, true)
          }
        }
        await props.fetchFlows()
        await props.fetchTopics()
      }
    }

    return {
      label: (
        <div className={style.treeNode}>
          {!isBuiltIn ? (
            <EditableText
              onConfirm={editTopic}
              defaultValue={isNew ? '' : folder}
              isEditing={isFocused}
              disabled={!isFocused}
              placeholder={
                isNew ? lang.tr('studio.flow.sidePanel.nameTopic') : lang.tr('studio.flow.sidePanel.renameTopic')
              }
              selectAllOnFocus={true}
            />
          ) : (
            <span>{folder}</span>
          )}
        </div>
      ),
      icon: 'none',
      name: `${filterOrder}/${folder}`
    }
  }

  const nodeRenderer = (el: NodeData) => {
    const { name, label, icon, type, triggerCount, referencedIn, countByTopic } = el
    const displayName = label || name.substr(name.lastIndexOf('/') + 1).replace(/\.flow\.json$/, '')
    const isFocused = name === props.focusedText
    const isNew = name === props.newPath
    const isQna = type === 'qna'
    const filterOrder = isNew ? 3 : !isQna ? 2 : 1

    const editWorkflow = async newName => {
      props.setFocusedText(undefined)
      props.setNewPath(undefined)
      setForceSelect(undefined)
      if (newName === '') {
        await props.fetchFlows()
        await props.fetchTopics()
      } else if (newName !== displayName) {
        const fullName = buildFlowName({ topic: el.topic, workflow: sanitize(newName) }, true)
        if (!props.flowsName.find(x => x.name === fullName)) {
          props.renameFlow({ targetFlow: name, name: fullName })
          props.updateFlow({ name: fullName })
          setForceSelect({ field: 'fullPath', value: fullName })
        } else {
          await props.fetchFlows()
          await props.fetchTopics()
        }
      }
    }

    return {
      label: (
        <div className={style.treeNode}>
          {!isQna ? (
            <EditableText
              onConfirm={editWorkflow}
              defaultValue={isNew ? '' : displayName}
              isEditing={isFocused}
              disabled={!isFocused}
              placeholder={
                isNew ? lang.tr('studio.flow.sidePanel.nameWorkflow') : lang.tr('studio.flow.sidePanel.renameWorkflow')
              }
              selectAllOnFocus={true}
            />
          ) : (
            <span>{displayName}</span>
          )}
        </div>
      ),
      icon: 'none',
      name: `${filterOrder}/${displayName}`
    }
  }

  const waitDoubleClick = (el: NodeData | string, type) => {
    if (type === 'folder') {
      return 200
    }
  }

  const onClick = (el: NodeData | string, type) => {
    if (el === props.focusedText) {
      return true
    }

    const nodeData = el as NodeData
    if (nodeData?.type === 'qna') {
      // Return true will mimic preventDefault for TreeView's onClick
      return true
    } else if (nodeData?.type === 'addWorkflow') {
      props.createWorkflow(nodeData.topic)
      return true
    }

    if (type === 'document') {
      props.goToFlow((el as NodeData).name)
    }
  }

  const onDoubleClick = (el: NodeData | string, type) => {
    if (typeof el === 'string') {
      props.setFocusedText(el)
    } else {
      const nodeData = el as NodeData
      if (nodeData?.type === 'qna') {
        props.editQnA(nodeData.name.replace('/qna', ''))
      } else if (nodeData?.type !== 'addWorkflow' && type === 'document') {
        props.setFocusedText(nodeData.name)
      }
    }
  }

  const postProcessing = tree => {
    tree.forEach(parent => {
      parent.childNodes?.forEach(node => {
        if (node.nodeData) {
          node.nodeData.topic = parent.id
        }
        if (node.id === `${parent.id}/qna`) {
          const wfCount = parent.childNodes?.filter(parentNode => node.id !== parentNode.id).length
          if (parent.id !== props.focusedText) {
            parent.label = (
              <div className={style.topicName}>
                {parent.label}
                <span className={style.tag}>
                  {node.nodeData?.countByTopic} Q&A · {wfCount} WF
                </span>
              </div>
            )
          }
        }
      })

      if (parent.id !== 'Built-In') {
        parent.childNodes?.push({
          id: 'addWorkflow',
          name: '4/addWorkflow',
          label: (
            <div className={cx(style.treeNode, style.addWorkflowNode)}>
              <span>{lang.tr('studio.flow.sidePanel.addWorkflow')}</span>
            </div>
          ),
          parent,
          icon: 'plus',
          type: 'addWorkflow',
          nodeData: {
            type: 'addWorkflow',
            topic: parent.id
          }
        })
      }
    })

    return tree
  }*/

  const handleContextMenu = (element: NodeData, level) => {
    if (level === 0) {
      const folder = element.id
      if (folder === 'default') {
        return null
      }

      return (
        <Menu>
          <MenuItem
            id="btn-edit"
            icon="edit"
            text={lang.tr('studio.flow.topicList.editTopic')}
            onClick={() => props.editTopic(folder)}
          />
          <MenuItem
            id="btn-export"
            disabled={props.readOnly}
            icon="upload"
            text={lang.tr('studio.flow.topicList.exportTopic')}
            onClick={() => props.exportTopic(folder)}
          />
          <MenuItem
            id="btn-delete"
            icon="trash"
            text={lang.tr('studio.flow.topicList.deleteTopic')}
            intent={Intent.DANGER}
            onClick={() => deleteTopic(folder)}
          />
          <MenuDivider />
          <MenuItem
            id="btn-create"
            disabled={props.readOnly}
            icon="add"
            text={lang.tr('studio.flow.topicList.createNewWorkflow')}
            onClick={() => props.createWorkflow(folder)}
          />
          <MenuItem
            id="btn-import"
            disabled={props.readOnly}
            icon="download"
            text={lang.tr('studio.flow.topicList.importExisting')}
            onClick={() => props.importWorkflow(name)}
          />
        </Menu>
      )
    } else if (element.type === 'qna') {
      const { name } = element as NodeData

      return (
        <Menu>
          <MenuItem
            id="btn-edit"
            disabled={props.readOnly}
            icon="edit"
            text={lang.tr('edit')}
            onClick={() => props.editQnA(name.replace('/qna', ''))}
          />
        </Menu>
      )
    } else {
      const { name } = element as NodeData

      return (
        <Menu>
          <MenuItem
            id="btn-edit"
            disabled={props.readOnly}
            icon="edit"
            text={lang.tr('studio.flow.topicList.editWorkflow')}
            onClick={() => props.editWorkflow(name, element)}
          />
          <MenuItem
            id="btn-duplicate"
            disabled={props.readOnly}
            icon="duplicate"
            text={lang.tr('duplicate')}
            onClick={() => props.duplicateFlow(name)}
          />
          <MenuItem
            id="btn-export"
            disabled={props.readOnly}
            icon="export"
            text={lang.tr('export')}
            onClick={() => props.exportWorkflow(name)}
          />
          <MenuDivider />
          <MenuItem
            id="btn-delete"
            disabled={lockedFlows.includes(name) || !props.canDelete || props.readOnly}
            icon="delete"
            text={lang.tr('delete')}
            onClick={() => deleteFlow(name)}
          />
        </Menu>
      )
    }
  }

  flows.push({
    label: undefined,
    name: 'potato/sub-potato/potato.flow.json',
    referencedIn: [],
    topic: 'potato',
    triggerCount: 0
  })

  flows.push({
    label: undefined,
    name: 'potato/sub-potato.flow.json',
    referencedIn: [],
    topic: 'potato',
    triggerCount: 0
  })

  const newFlows = {}

  for (const workflow of flows) {
    const splitPath = workflow.name.split('/')
    const nodeLabel = splitPath.pop().replace('.flow.json', '')

    if (!splitPath.length) {
      if (!newFlows['default']) {
        newFlows['default'] = {
          type: 'default',
          id: 'default',
          label: lang.tr('studio.flow.topicList.defaultWorkflows'),
          children: {
            [nodeLabel]: { ...workflow, id: workflow.label }
          }
        }
      } else {
        newFlows['default'].children[nodeLabel] = { ...workflow, id: workflow.label }
      }
    }

    splitPath.reduce((acc, parent, index) => {
      if (!acc[parent]) {
        acc[parent] = { id: parent, children: {} }
      }

      if (index === splitPath.length - 1) {
        if (acc[parent].children[nodeLabel]) {
          acc[parent].children[nodeLabel] = { ...acc[parent].children[nodeLabel], ...workflow, id: nodeLabel }
        } else {
          acc[parent].children[nodeLabel] = { ...workflow, id: nodeLabel, children: {} }
        }
      }

      return acc[parent].children
    }, newFlows)
  }

  const sortItems = flows => {
    return flows.sort((a, b) => {
      const aItem = (a.label || a.id).toUpperCase()
      const bItem = (b.label || b.id).toUpperCase()
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

  const handleClick = ({ path, level, ...item }) => {
    if (item.children.length) {
      setExpanded({ ...expanded, [path]: !expanded[path] })
    }

    if (level !== 0) {
      props.goToFlow(item.name)
    }
  }

  const printTree = (item, level, parentId = '') => {
    const hasChildren = !!item.children.length
    const path = `${parentId}${parentId && '/'}${item.id}`

    return (
      <div className={item.type} key={path}>
        <TreeItem
          className={cx(style.treeItem, {
            [style.isTopic]: level === 0,
            [style.active]: item.name === props.currentFlow?.name
          })}
          item={item}
          level={level}
          contextMenu={handleContextMenu(item, level)}
          onClick={() => handleClick({ ...item, level, path })}
        />
        {hasChildren && expanded[path] && item.children.map(child => printTree(child, level + 1, path))}
      </div>
    )
  }

  const newFlowsAsArray = getFlattenFlows(newFlows)
  const isEmpty = !newFlowsAsArray.filter(item => item.type !== 'default').length

  return (
    <div className={cx(style.tree)}>
      {/*<TreeView<NodeData>
        elements={flows}
        nodeRenderer={nodeRenderer}
        folderRenderer={folderRenderer}
        postProcessing={postProcessing}
        onContextMenu={handleContextMenu}
        onClick={onClick}
        expandedPaths={props.expandedPaths}
        onExpandToggle={props.onExpandToggle}
        onDoubleClick={onDoubleClick}
        waitDoubleClick={waitDoubleClick}
        filterText={props.filter}
        pathProps="name"
        filterProps="name"
        forceSelect={forceSelect}
      />*/}
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
