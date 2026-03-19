import { wrapActionAndInjectOctokit } from 'src/misc/action-wrapper'
import * as mapping from '../mapping'

const REPOS_PAGE_SIZE = 100
const CONTENTS_PAGE_SIZE = 100

export const filesReadonlyListItemsInFolder = wrapActionAndInjectOctokit(
  { actionName: 'filesReadonlyListItemsInFolder', errorMessage: 'Failed to list items in folder' },
  async ({ octokit, owner }, { folderId, filters, nextToken: prevToken }) => {
    if (!folderId) {
      return await _listRepos({ octokit, owner, prevToken, filters })
    }

    const repoInfo = mapping.decodeRepoFolderId(folderId)
    if (repoInfo) {
      return await _listRepoRoot({ octokit, ...repoInfo, prevToken, filters })
    }

    const contentInfo = mapping.decodeContentId(folderId)
    if (contentInfo) {
      return await _listFolderContents({ octokit, ...contentInfo, parentId: folderId, filters, prevToken })
    }

    return { items: [], meta: { nextToken: undefined } }
  }
)

const _listRepos = async ({
  octokit,
  owner,
  prevToken,
  filters,
}: {
  octokit: { rest: any }
  owner: string
  prevToken?: string
  filters?: { itemType?: string; maxSizeInBytes?: number; modifiedAfter?: string }
}) => {
  if (filters?.itemType === 'file') {
    return { items: [], meta: { nextToken: undefined } }
  }

  const page = prevToken ? parseInt(prevToken, 10) : 1

  const response = await octokit.rest.repos.listForOrg({
    org: owner,
    per_page: REPOS_PAGE_SIZE,
    page,
    type: 'all',
  })

  const repos = response.data as mapping.GitHubRepo[]
  const items = repos.map(mapping.mapRepoToFolder)

  const hasMore = repos.length === REPOS_PAGE_SIZE
  return {
    items,
    meta: { nextToken: hasMore ? String(page + 1) : undefined },
  }
}

const _listRepoRoot = async ({
  octokit,
  owner,
  repo,
  prevToken,
  filters,
}: {
  octokit: { rest: any }
  owner: string
  repo: string
  prevToken?: string
  filters?: { itemType?: string; maxSizeInBytes?: number; modifiedAfter?: string }
}) => {
  return _listFolderContents({
    octokit,
    owner,
    repo,
    path: '',
    parentId: mapping.encodeRepoFolderId(owner, repo),
    filters,
    prevToken,
  })
}

const _listFolderContents = async ({
  octokit,
  owner,
  repo,
  path,
  parentId,
  filters,
  prevToken,
}: {
  octokit: { rest: any }
  owner: string
  repo: string
  path: string
  parentId: string
  filters?: { itemType?: string; maxSizeInBytes?: number; modifiedAfter?: string }
  prevToken?: string
}) => {
  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: path || '',
  })

  const contents = Array.isArray(response.data) ? response.data : [response.data]
  const contentItems = contents as mapping.GitHubContentItem[]

  const startIndex = prevToken ? parseInt(prevToken, 10) : 0
  const pageItems = contentItems.slice(startIndex, startIndex + CONTENTS_PAGE_SIZE)

  let mappedItems = pageItems.map((item) => mapping.mapContentItemToItem(owner, repo, item, parentId))

  if (filters?.itemType) {
    const filterType = filters.itemType === 'folder' ? 'folder' : 'file'
    mappedItems = mappedItems.filter((item) => item.type === filterType)
  }

  if (filters?.maxSizeInBytes) {
    mappedItems = mappedItems.filter(
      (item) => item.type !== 'file' || !item.sizeInBytes || item.sizeInBytes <= filters.maxSizeInBytes!
    )
  }

  const hasMore = startIndex + CONTENTS_PAGE_SIZE < contentItems.length
  return {
    items: mappedItems,
    meta: { nextToken: hasMore ? String(startIndex + CONTENTS_PAGE_SIZE) : undefined },
  }
}
