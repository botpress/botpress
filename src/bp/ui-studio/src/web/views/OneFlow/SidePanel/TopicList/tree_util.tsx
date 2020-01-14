import { Button, Position, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'
import { addNode, FLOW_ICON, FOLDER_ICON, sortChildren } from '~/util/tree_common'

import style from '../style.scss'

const folderLabel = (folder, actions) => {
  const createGoal = e => {
    e.stopPropagation()
    actions.createGoal()
  }

  const editTopic = e => {
    e.stopPropagation()
    actions.editTopic(folder)
  }

  return (
    <div className={style.treeNode}>
      <span>{folder}</span>
      <div className={style.overhidden} id="actions">
        <Tooltip content={<span>Edit topic</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
          <Button icon="edit" minimal={true} onClick={editTopic} />
        </Tooltip>
        <Tooltip content={<span>Create new goal</span>} hoverOpenDelay={500} position={Position.BOTTOM}>
          <Button icon="insert" minimal={true} onClick={createGoal} />
        </Tooltip>
      </div>
    </div>
  )
}

const reorderFlows = flows => {
  return [
    flows.find(x => x.id === 'main'),
    flows.find(x => x.id === 'error'),
    flows.find(x => x.id === 'timeout'),
    ...flows.filter(x => !['main', 'error', 'timeout'].includes(x.id))
  ].filter(x => Boolean(x))
}

export const splitFlowPath = (flow, actions, flowData) => {
  const flowPath = flow.replace(/\.flow\.json$/, '').split('/')
  const flowName = flowPath[flowPath.length - 1]
  const flowFolders = flowPath.slice(0, flowPath.length - 1)
  const folders = []
  const currentPath = []

  for (const folder of flowFolders) {
    currentPath.push(folder)
    folders.push({
      id: folder,
      type: 'folder',
      icon: FOLDER_ICON,
      label: folderLabel(folder, actions),
      fullPath: currentPath.join('/')
    })
  }

  currentPath.push(flowName)
  const id = currentPath.join('/')

  return {
    folders,
    flow: {
      id,
      icon: FLOW_ICON,
      label: flowData.label || flowName,
      fullPath: id,
      type: 'flow'
    }
  }
}

export const buildFlowsTree = (flows, filterName, actions) => {
  const tree = { icon: 'root', fullPath: '', label: '<root>', childNodes: [] }
  flows.forEach(flowData => {
    const { folders, flow } = splitFlowPath(flowData.name, actions, flowData)
    if (!filterName || flow.id.includes(filterName)) {
      addNode(tree, folders, flow, { nodeData: flowData })
    }
  })

  sortChildren(tree)

  return reorderFlows(tree.childNodes)
}
