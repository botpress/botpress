import find from 'lodash/find'

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

export const splitPath = location => {
  const paths = location.split('/')
  const filename = paths[paths.length - 1]
  const fileFolders = paths.slice(0, paths.length - 1)
  const folders = []
  const currentPath = []

  for (const folder of fileFolders) {
    currentPath.push(folder)
    folders.push({ icon: 'folder-close', label: folder, fullPath: currentPath.join('/') })
  }
  currentPath.push(filename)
  return {
    folders,
    location: { icon: 'document', label: filename, fullPath: currentPath.join('/') }
  }
}

export const buildTree = files => {
  const tree = { type: 'root', fullPath: '', label: '<root>', childNodes: [] }
  files.forEach(fileData => {
    const { folders, location } = splitPath(fileData.location)
    addNode(tree, folders, location, {
      data: fileData
    })
  })

  return tree.childNodes
}
