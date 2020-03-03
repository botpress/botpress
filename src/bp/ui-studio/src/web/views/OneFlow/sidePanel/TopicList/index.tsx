import { Button, Menu, MenuDivider, MenuItem, Position, Tooltip } from '@blueprintjs/core'
import { Flow } from 'botpress/sdk'
import { confirmDialog, TreeView } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

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

  canDelete: boolean
  goToFlow: Function
  flows: { name: string; label: string }[]

  duplicateFlow: Function
  deleteFlow: Function
  exportGoal: Function

  importGoal: (topicId: string) => void
  createGoal: (topicId: string) => void
  editGoal: (goalId: any, data: any) => void
  editTopic: (topicName: string | NodeData) => void
  exportTopic: (topicName: string | NodeData) => void
}

interface NodeData {
  name: string
  type: 'goal' | 'folder' | 'topic'
  label?: string
  id?: any
}

const TopicList: FC<Props> = props => {
  const deleteFlow = async (name: string) => {
    if (await confirmDialog(`Are you sure you want to delete the flow ${name}?`, {})) {
      props.deleteFlow(name)
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
      return (
        <Menu>
          <MenuItem id="btn-edit" icon="edit" text="Edit Topic" onClick={() => props.editTopic(element)} />
          <MenuItem
            id="btn-export"
            disabled={props.readOnly}
            icon="upload"
            text="Export Topic"
            onClick={() => props.exportTopic(element)}
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
    } else {
      const { id, name, type } = element as NodeData

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

  const nodeRenderer = el => {
    const editGoal = e => {
      e.stopPropagation()
      props.editGoal(el.name, el)
    }
    const deleteGoal = async e => {
      e.stopPropagation()
      await deleteFlow(el.name)
    }

    const name = el.label || el.name.substr(el.name.lastIndexOf('/') + 1).replace(/\.flow\.json$/, '')

    return {
      label: (
        <div className={style.treeNode}>
          <span>{name}</span>
          <div className={style.overhidden} id="actions">
            <Tooltip content={<span>Edit goal</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
              <Button icon="edit" minimal onClick={editGoal} />
            </Tooltip>
            <Tooltip content={<span>Delete goal</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
              <Button icon="trash" minimal onClick={deleteGoal} />
            </Tooltip>
          </div>
        </div>
      )
    }
  }

  const onClick = (element: NodeData | string, type) => {
    if (type === 'document') {
      props.goToFlow((element as NodeData).name)
    }
  }

  const onDoubleClick = (element: NodeData, type) => {
    if (type === 'document') {
      props.editGoal(element.name, element)
    }
  }

  const activeFlow = props.currentFlow?.name
  return (
    <TreeView<NodeData>
      elements={props.flows}
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
