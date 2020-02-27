import _ from 'lodash'
import React from 'react'

import { addNode, FLOW_ICON, FOLDER_ICON, sortChildren } from '../../../../util/tree_common'
import style from '../style.scss'

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
      label: folder,
      fullPath: currentPath.join('/')
    })
  }

  currentPath.push(flowName)
  const id = currentPath.join('/')

  const dropElement = (
    <div
      className={style.grabbable}
      draggable={true}
      onDragStart={event => {
        const { contentId, type } = flowData
        event.dataTransfer.setData('diagram-node', JSON.stringify({ contentId, type: 'node', id: type }))
      }}
    >
      {flowName}
    </div>
  )

  return {
    folders,
    flow: {
      id,
      icon: FLOW_ICON,
      label: dropElement,
      fullPath: id,
      type: 'flow'
    }
  }
}

export const buildFlowsTree = (flows, filterName, actions) => {
  const tree = { icon: 'root', fullPath: '', label: '<root>', childNodes: [] }
  flows.forEach(flowData => {
    const { folders, flow } = splitFlowPath(flowData.path, actions, flowData)
    if (!filterName || flow.id.includes(filterName)) {
      addNode(tree, folders, flow, { nodeData: flowData })
    }
  })

  sortChildren(tree)

  return tree.childNodes
}
