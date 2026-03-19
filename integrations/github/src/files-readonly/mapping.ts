import * as bp from '.botpress'

type FilesReadonlyFile = bp.events.Events['fileCreated']['file']
type FilesReadonlyFolder = bp.events.Events['folderDeletedRecursive']['folder']
type FilesReadonlyItem = FilesReadonlyFile | FilesReadonlyFolder

export type GitHubContentItem = {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir' | 'submodule' | 'symlink'
}

export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  default_branch: string
  owner: { login: string }
}

const REPO_PREFIX = 'repo:'
const PATH_SEPARATOR = '/'

export const encodeRepoFolderId = (owner: string, repo: string): string => `${REPO_PREFIX}${owner}/${repo}`

export const decodeRepoFolderId = (folderId: string): { owner: string; repo: string } | null => {
  if (!folderId.startsWith(REPO_PREFIX)) {
    return null
  }
  const parts = folderId.slice(REPO_PREFIX.length).split('/')
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return null
  }
  return { owner: parts[0], repo: parts[1] }
}

export const encodeContentId = (owner: string, repo: string, path: string): string =>
  `${REPO_PREFIX}${owner}/${repo}/${path}`

export const decodeContentId = (id: string): { owner: string; repo: string; path: string } | null => {
  if (!id.startsWith(REPO_PREFIX)) {
    return null
  }
  const rest = id.slice(REPO_PREFIX.length)
  const slashIdx1 = rest.indexOf('/')
  if (slashIdx1 === -1) {
    return null
  }
  const owner = rest.slice(0, slashIdx1)
  const slashIdx2 = rest.indexOf('/', slashIdx1 + 1)
  if (slashIdx2 === -1) {
    return null
  }
  const repo = rest.slice(slashIdx1 + 1, slashIdx2)
  const path = rest.slice(slashIdx2 + 1)
  return { owner, repo, path }
}

export const mapRepoToFolder = (repo: GitHubRepo): FilesReadonlyFolder => ({
  id: encodeRepoFolderId(repo.owner.login, repo.name),
  name: repo.full_name,
  type: 'folder',
  absolutePath: `/${repo.full_name}`,
})

export const mapContentItemToItem = (
  owner: string,
  repo: string,
  item: GitHubContentItem,
  parentId?: string
): FilesReadonlyItem => {
  const id = encodeContentId(owner, repo, item.path)
  const absolutePath = `/${owner}/${repo}/${item.path}`

  if (item.type === 'dir') {
    return {
      id,
      name: item.name,
      type: 'folder',
      parentId,
      absolutePath,
    }
  }

  return {
    id,
    name: item.name,
    type: 'file',
    parentId,
    absolutePath,
    sizeInBytes: item.size,
    contentHash: item.sha,
  }
}

export const mapPushFileToFile = (
  owner: string,
  repo: string,
  filePath: string
): FilesReadonlyFile => {
  const name = filePath.split(PATH_SEPARATOR).pop() ?? filePath
  return {
    id: encodeContentId(owner, repo, filePath),
    name,
    type: 'file',
    absolutePath: `/${owner}/${repo}/${filePath}`,
  }
}

export const mapPushFolderToFolder = (
  owner: string,
  repo: string,
  folderPath: string
): FilesReadonlyFolder => {
  const name = folderPath.split(PATH_SEPARATOR).pop() ?? folderPath
  return {
    id: encodeContentId(owner, repo, folderPath),
    name,
    type: 'folder',
    absolutePath: `/${owner}/${repo}/${folderPath}`,
  }
}
