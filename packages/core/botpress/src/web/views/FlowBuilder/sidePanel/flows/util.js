import find from 'lodash/find'

const addNode = (tree, path, name, data) => {
  while (path.length) {
    const folderName = path.shift()
    let folder = find(tree.children, { name: folderName, type: 'folder' })
    if (!folder) {
      folder = { name: folderName, type: 'folder', children: [] }
      tree.children.push(folder)
    }
    if (data.active) {
      folder.toggled = true
    }
    tree = folder
  }
  tree.children.push({ name, type: 'file', ...data })
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

export const buildFlowsTree = (flows, { currentFlow }) => {
  const tree = { name: null, children: [] }
  flows.forEach(flow => {
    const flowPath = flow.name.replace(/\.flow\.json$/, '').split('/')
    const flowName = flowPath[flowPath.length - 1]
    addNode(tree, flowPath.slice(0, flowPath.length - 1), flowName, {
      data: flow,
      active: currentFlow && flow.name === currentFlow.name
    })
  })

  sortChildren(tree)

  return tree.children
}
