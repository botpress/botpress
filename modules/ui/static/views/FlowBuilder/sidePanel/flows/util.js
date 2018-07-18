import find from 'lodash/find'

const addNode = (tree, folders, flowDesc, data) => {
  for (const folderDesc of folders) {
    let folder = find(tree.children, folderDesc)
    if (!folder) {
      folder = { ...folderDesc, parent: tree, children: [] }
      tree.children.push(folder)
    }
    tree = folder
  }
  tree.children.push({ ...flowDesc, parent: tree, ...data })
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
  if (!tree.children) {
    return
  }
  tree.children.sort(compareNodes)
  tree.children.forEach(sortChildren)
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
    folders.push({ type: 'folder', name: folder, fullPath: currentPath.join('/') })
  }
  currentPath.push(flowName)
  return {
    folders,
    flow: { type: 'file', name: flowName, fullPath: currentPath.join('/') }
  }
}

export const buildFlowsTree = flows => {
  const tree = { type: 'root', fullPath: '', name: '<root>', children: [] }
  flows.forEach(flowData => {
    const { folders, flow } = splitFlowPath(flowData.name)
    addNode(tree, folders, flow, {
      data: flowData
    })
  })

  sortChildren(tree)

  return tree.children
}
