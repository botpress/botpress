import { Button, Intent, Menu, MenuDivider, MenuItem, Position, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import { Flow, Topic } from 'botpress/sdk'
import { confirmDialog, TreeView } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import style from '../style.scss'

const lockedFlows = ['main.flow.json', 'error.flow.json']

export const TYPE_TOPIC = 'topic'
export const TYPES = {
  Topic: 'topic',
  Goal: 'goal',
  Folder: 'folder'
}

interface Props {
  filter: string
  readOnly: boolean
  currentFlow: Flow
  topics: Topic[]

  canDelete: boolean
  goToFlow: Function
  flows: IFlow[]

  duplicateFlow: Function
  deleteFlow: Function
  exportGoal: Function
  fetchTopics: () => void

  importGoal: (topicId: string) => void
  createGoal: (topicId: string) => void
  editQnA: (topicName: string) => void
  editGoal: (goalId: any, data: any) => void
  editTopic: (topicName: string | NodeData) => void
  exportTopic: (topicName: string | NodeData) => void
}

interface NodeData {
  name: string
  type?: NodeType
  label?: string
  id?: any
  icon?: string
  triggerCount?: number
  /** List of workflows which have a reference to it */
  referencedIn?: string[]
}

type NodeType = 'goal' | 'folder' | 'topic' | 'qna'

interface IFlow {
  name: string
  label: string
}

const TopicList: FC<Props> = props => {
  const [flows, setFlows] = useState<NodeData[]>([])

  useEffect(() => {
    const qna = props.topics.map(topic => ({
      name: `${topic.name}/qna`,
      label: 'Q&A',
      type: 'qna' as NodeType,
      icon: 'chat'
    }))

    setFlows([...qna, ...props.flows])
  }, [props.flows, props.topics])

  const deleteFlow = async (name: string) => {
    if (await confirmDialog(`Are you sure you want to delete the flow ${name}?`, {})) {
      props.deleteFlow(name)
    }
  }

  const deleteTopic = async (name: string) => {
    const matcher = new RegExp(`^${name}/`)
    const flowsToDelete = props.flows.filter(x => matcher.test(x.name))

    if (
      await confirmDialog(
        <span>
          Are you sure you want to delete the topic {name}?<br />
          <br />
          {!!flowsToDelete.length && (
            <>
              <strong>WARNING:</strong> {flowsToDelete.length} flows associated with the topic will be deleted
            </>
          )}
        </span>,
        {}
      )
    ) {
      await axios.post(`${window.BOT_API_PATH}/deleteTopic/${name}`)
      flowsToDelete.forEach(flow => props.deleteFlow(flow.name))
      props.fetchTopics()
    }
  }

  const folderRenderer = (folder: string) => {
    const createGoal = e => {
      e.stopPropagation()
      props.createGoal(folder)
    }

    const editTopic = e => {
      e.stopPropagation()
      props.editTopic(folder)
    }

    return {
      label: (
        <div className={style.treeNode}>
          <span>{folder}</span>
          <div className={style.overhidden} id="actions">
            <Tooltip content={<span>Edit topic</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
              <Button icon="edit" minimal onClick={editTopic} />
            </Tooltip>
            <Tooltip content={<span>Create new goal</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
              <Button icon="insert" minimal onClick={createGoal} />
            </Tooltip>
          </div>
        </div>
      )
    }
  }

  const handleContextMenu = (element: NodeData | string, elementType) => {
    if (elementType === 'folder') {
      const folder = element as string
      return (
        <Menu>
          <MenuItem id="btn-edit" icon="edit" text="Edit Topic" onClick={() => props.editTopic(folder)} />
          <MenuItem
            id="btn-export"
            disabled={props.readOnly}
            icon="upload"
            text="Export Topic"
            onClick={() => props.exportTopic(folder)}
          />
          <MenuItem
            id="btn-delete"
            icon="trash"
            text="Delete Topic"
            intent={Intent.DANGER}
            onClick={() => deleteTopic(folder)}
          />
          <MenuDivider />
          <MenuItem
            id="btn-create"
            disabled={props.readOnly}
            icon="add"
            text="Create new Goal"
            onClick={() => props.createGoal(name)}
          />
          <MenuItem
            id="btn-import"
            disabled={props.readOnly}
            icon="download"
            text="Import existing Goal"
            onClick={() => props.importGoal(name)}
          />
        </Menu>
      )
    } else if (_.isObject(element) && (element as NodeData).type === 'qna') {
      const { name } = element as NodeData

      return (
        <Menu>
          <MenuItem
            id="btn-edit"
            disabled={props.readOnly}
            icon="edit"
            text="Edit Q&A"
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
            text="Edit Goal"
            onClick={() => props.editGoal(name, element)}
          />
          <MenuItem
            id="btn-duplicate"
            disabled={props.readOnly}
            icon="duplicate"
            text="Duplicate"
            onClick={() => props.duplicateFlow(name)}
          />
          <MenuItem
            id="btn-export"
            disabled={props.readOnly}
            icon="export"
            text="Export"
            onClick={() => props.exportGoal(name)}
          />
          <MenuDivider />
          <MenuItem
            id="btn-delete"
            disabled={lockedFlows.includes(name) || !props.canDelete || props.readOnly}
            icon="delete"
            text="Delete"
            onClick={() => deleteFlow(name)}
          />
        </Menu>
      )
    }
  }

  const nodeRenderer = (el: NodeData) => {
    const { name, label, icon, type, triggerCount, referencedIn } = el
    const editGoal = e => {
      e.stopPropagation()
      props.editGoal(name, el)
    }
    const deleteGoal = async e => {
      e.stopPropagation()
      await deleteFlow(name)
    }
    const editQnA = e => {
      e.stopPropagation()
      props.editQnA(name.replace('/qna', ''))
    }

    const displayName = label || name.substr(name.lastIndexOf('/') + 1).replace(/\.flow\.json$/, '')

    const tooltip = (
      <>
        <Tooltip content="Number of NLU triggers on that workflow" hoverOpenDelay={500}>
          <small>({triggerCount})</small>
        </Tooltip>
        &nbsp;&nbsp;
        {!!referencedIn?.length && (
          <Tooltip
            content={
              <div>
                Workflows referencing this workflow:{' '}
                <ul>
                  {referencedIn.map(x => (
                    <li>{x}</li>
                  ))}
                </ul>
              </div>
            }
            hoverOpenDelay={500}
          >
            <small>
              <span className={style.referencedWorkflows}>({referencedIn?.length})</span>
            </small>
          </Tooltip>
        )}
      </>
    )

    return {
      label: (
        <div className={style.treeNode}>
          <span>
            {displayName} {type !== 'qna' && tooltip}
          </span>
          <div className={style.overhidden} id="actions">
            {type !== 'qna' && (
              <Fragment>
                <Tooltip content={<span>Edit goal</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
                  <Button icon="edit" minimal onClick={editGoal} />
                </Tooltip>
                <Tooltip content={<span>Delete goal</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
                  <Button icon="trash" minimal onClick={deleteGoal} />
                </Tooltip>
              </Fragment>
            )}
            {type === 'qna' && (
              <Tooltip content={<span>Edit Q&A</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
                <Button icon="edit" minimal onClick={editQnA} />
              </Tooltip>
            )}
          </div>
        </div>
      ),
      icon
    }
  }

  const onClick = (el: NodeData | string, type) => {
    if ((el as NodeData)?.type === 'qna') {
      // Return true will mimic preventDefault for TreeView's onClick
      return true
    }

    if (type === 'document') {
      props.goToFlow((el as NodeData).name)
    }
  }

  const onDoubleClick = (el: NodeData, type) => {
    if (el.type === 'qna') {
      props.editQnA(el.name.replace('/qna', ''))
    } else if (type === 'document') {
      props.editGoal(el.name, el)
    }
  }

  const activeFlow = props.currentFlow?.name
  return (
    <TreeView<NodeData>
      elements={flows}
      nodeRenderer={nodeRenderer}
      folderRenderer={folderRenderer}
      onContextMenu={handleContextMenu}
      onClick={onClick}
      visibleElements={activeFlow && [{ field: 'name', value: activeFlow }]}
      onDoubleClick={onDoubleClick}
      filterText={props.filter}
      pathProps="name"
      filterProps="name"
    />
  )
}

export default TopicList
