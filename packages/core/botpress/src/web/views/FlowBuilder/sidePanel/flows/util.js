import find from 'lodash/find'

const addNode = (tree, path, name, data) => {
  const fullPath = []
  while (path.length) {
    const folderName = path.shift()
    fullPath.push(folderName)
    let folder = find(tree.children, { name: folderName, type: 'folder' })
    if (!folder) {
      folder = { parent: tree, name: folderName, fullPath: fullPath.join('/'), type: 'folder', children: [] }
      tree.children.push(folder)
    }
    tree = folder
  }
  fullPath.push(name)
  tree.children.push({ parent: tree, name, type: 'file', fullPath: fullPath.join('/'), ...data })
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

export const buildFlowsTree = flows => {
  const tree = { type: 'root', fullPath: '', name: '<root>', children: [] }
  flows.forEach(flow => {
    const flowPath = flow.name.replace(/\.flow\.json$/, '').split('/')
    const flowName = flowPath[flowPath.length - 1]
    addNode(tree, flowPath.slice(0, flowPath.length - 1), flowName, {
      data: flow
    })
  })

  sortChildren(tree)

  return tree.children
}
