import find from 'lodash/find'
import React from 'react'

import { ERROR_FLOW_ICON, FLOW_ICON, FOLDER_ICON, MAIN_FLOW_ICON } from './FlowsList'

const getNodeIcon = (flowId: string) => {
  if (flowId === 'main') {
    return MAIN_FLOW_ICON
  } else if (flowId === 'error') {
    return ERROR_FLOW_ICON
  }
  return FLOW_ICON
}

const getNodeLabel = (flowId: string, flowName: string) => {
  if (flowId === 'main') {
    return <strong>Main entry point</strong>
  } else if (flowId === 'error') {
    return <strong>Error handling</strong>
  }
  return flowName
}

const addNode = (tree, folders, flowDesc, data) => {
  for (const folderDesc of folders) {
    let folder = find(tree.childNodes, folderDesc)
    if (!folder) {
      folder = { ...folderDesc, parent: tree, childNodes: [] }
      tree.childNodes.push(folder)
    }
    tree = folder
  }
  tree.childNodes.push({ ...flowDesc, parent: tree, ...data })
}

const compareNodes = (a, b) => {
  // Always display the main flow and error flow as the top node
  if (a.id === 'main' || a.id === 'error') {
    return -1
  }

  if (a.type === b.type) {
    return a.name < b.name ? -1 : 1
  }
  if (a.type === 'folder') {
    return -1
  } else {
    return 1
  }
}

const sortChildren = tree => {
  if (!tree.childNodes) {
    return
  }
  tree.childNodes.sort(compareNodes)
  tree.childNodes.forEach(sortChildren)
}

export const getUniqueId = node => `${node.type}:${node.fullPath}`

export const splitFlowPath = flow => {
  const flowPath = flow.replace(/\.flow\.json$/, '').split('/')
  const flowName = flowPath[flowPath.length - 1]
  const flowFolders = flowPath.slice(0, flowPath.length - 1)
  const folders = []
  const currentPath = []

  for (const folder of flowFolders) {
    currentPath.push(folder)
    folders.push({ id: folder, icon: FOLDER_ICON, label: folder, fullPath: currentPath.join('/') })
  }

  currentPath.push(flowName)
  const id = currentPath.join('/')
  return {
    folders,
    flow: {
      id,
      defaultIcon: getNodeIcon(id),
      label: getNodeLabel(id, flowName),
      fullPath: id
    }
  }
}

export const buildFlowsTree = flows => {
  const tree = { icon: 'root', fullPath: '', label: '<root>', childNodes: [] }
  flows.forEach(flowData => {
    const { folders, flow } = splitFlowPath(flowData.name)
    addNode(tree, folders, flow, { nodeData: flowData })
  })

  sortChildren(tree)

  console.log(tree)

  return tree.childNodes
}
