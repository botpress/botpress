import find from 'lodash/find'

import { FLOW_ICON, FOLDER_ICON } from './FlowsList'

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
    folders.push({ icon: FOLDER_ICON, label: folder, fullPath: currentPath.join('/') })
  }

  currentPath.push(flowName)
  return {
    folders,
    flow: {
      id: currentPath.join('/'),
      icon: FLOW_ICON,
      label: flowName,
      fullPath: currentPath.join('/')
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

  return tree.childNodes
}
