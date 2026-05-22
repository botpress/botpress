import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from 'src/mime-types'
import { Client as DriveClient } from '../../client'
import { GoogleDriveNodeTree, type GoogleDriveNode } from '../google-drive-file-tree'
import * as bp from '.botpress'

const GOOGLE_DRIVE_TREE_FILE_KEY = 'google-drive-file-tree.json'
const SYNTHETIC_NEXT_TOKEN_PREFIX = 'synthetic-tree-index:'
const SYNTHETIC_BATCH_SIZE = 100

type FilesReadonlyListItemsInFolderReturn = bp.actions.Actions['filesReadonlyListItemsInFolder']['output']
type FilesReadonlyListItemsInFolderProps = bp.ActionProps['filesReadonlyListItemsInFolder']

export const filesReadonlyListItemsInFolder: bp.IntegrationProps['actions']['filesReadonlyListItemsInFolder'] = async (
  props
) => (props.input.folderId ? await _listItemsInSpecificFolder(props) : await _listItemsInRootFolder(props))

const _listItemsInSpecificFolder = async (
  props: FilesReadonlyListItemsInFolderProps
): Promise<FilesReadonlyListItemsInFolderReturn> => {
  const nodeTree = await _loadNodeTree(props.client)
  const node = nodeTree.getNodeById(props.input.folderId!)

  return _enumerateNodeChildren({ node, nextToken: props.input.nextToken })
}

const _enumerateNodeChildren = ({ node, nextToken }: { node?: GoogleDriveNode; nextToken?: string }) => {
  const nodeChildren = node?.children ?? []
  const batchChildIndex = parseInt(nextToken?.slice(SYNTHETIC_NEXT_TOKEN_PREFIX.length) ?? '0', 10)

  if (batchChildIndex >= nodeChildren.length) {
    return { items: [], meta: { nextToken: undefined } }
  }

  const nextBatchIndex = batchChildIndex + SYNTHETIC_BATCH_SIZE
  const currentBatch = nodeChildren.slice(batchChildIndex, nextBatchIndex)
  const mappedBatchItems = currentBatch.map(_mapNodeToBatchItem)

  return {
    items: mappedBatchItems,
    meta: {
      nextToken: nextBatchIndex < nodeChildren.length ? _getNextTokenForChildIndex(nextBatchIndex) : undefined,
    },
  }
}

const _mapNodeToBatchItem = (item: GoogleDriveNode) =>
  ({
    id: item.id,
    name: item.name,
    parentId: item.parents?.[0] ?? 'root',
    ...(item.mimeType === APP_GOOGLE_FOLDER_MIMETYPE
      ? {
          type: 'folder' as const,
        }
      : {
          type: 'file' as const,
          sizeInBytes: parseInt(item.size ?? '0', 10),
          lastModifiedDate: item.modifiedTime,
          contentHash: item.sha256Checksum ?? item.md5Checksum ?? item.version ?? undefined,
        }),
  }) as const

const _listItemsInRootFolder = async (
  props: FilesReadonlyListItemsInFolderProps
): Promise<FilesReadonlyListItemsInFolderReturn> => {
  if (props.input.nextToken?.startsWith(SYNTHETIC_NEXT_TOKEN_PREFIX)) {
    return await _enumerateNodeTreeItems(props.client, props.input.nextToken)
  }

  const driveClient = await DriveClient.create(props)
  const filterString = _buildFilterString(props.input.filters)

  return props.input.nextToken
    ? await _enumerateDriveItemsNextPage(driveClient, props.client, props.input.nextToken, filterString)
    : await _enumerateDriveItemsFirstPage(driveClient, props.client, filterString)
}

const _enumerateNodeTreeItems = async (
  client: FilesReadonlyListItemsInFolderProps['client'],
  nextToken: string
): Promise<FilesReadonlyListItemsInFolderReturn> => {
  const nodeTree = await _loadNodeTree(client)
  const rootNode = nodeTree.getRootNode()

  return _enumerateNodeChildren({ node: rootNode, nextToken })
}

const _loadNodeTree = async (client: FilesReadonlyListItemsInFolderProps['client']): Promise<GoogleDriveNodeTree> => {
  const { file } = await client.getFile({
    id: GOOGLE_DRIVE_TREE_FILE_KEY,
  })
  return GoogleDriveNodeTree.fromJSON(await fetch(file.url).then((res) => res.text()))
}

const _getNextTokenForChildIndex = (childIndex: number): string => `${SYNTHETIC_NEXT_TOKEN_PREFIX}${childIndex}`

const _buildFilterString = (filters: FilesReadonlyListItemsInFolderProps['input']['filters']): string => {
  const query: string[] = []

  if (filters?.itemType === 'file') {
    query.push(`mimeType != '${APP_GOOGLE_FOLDER_MIMETYPE}'`, `mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}'`)
  } else if (filters?.itemType === 'folder') {
    query.push(`mimeType = '${APP_GOOGLE_FOLDER_MIMETYPE}'`)
  } else {
    query.push(`mimeType != '${APP_GOOGLE_SHORTCUT_MIMETYPE}'`)
  }

  if (filters?.maxSizeInBytes) {
    query.push(`size <= ${filters.maxSizeInBytes}`)
  }

  if (filters?.modifiedAfter) {
    query.push(`modifiedTime > '${filters.modifiedAfter}'`)
  }

  return query.join(' and ')
}

const _enumerateDriveItemsFirstPage = async (
  driveClient: DriveClient,
  client: bp.Client,
  filters: string
): Promise<FilesReadonlyListItemsInFolderReturn> => {
  const rootFolderId = await driveClient.getRootFolderId()
  const nodeTree = new GoogleDriveNodeTree({ rootFolderId })

  return await _enumerateGoogleDriveAndBuildNodeTree({
    driveClient,
    client,
    nextToken: undefined,
    filters,
    nodeTree,
  })
}

const _enumerateDriveItemsNextPage = async (
  driveClient: DriveClient,
  client: FilesReadonlyListItemsInFolderProps['client'],
  nextToken: string,
  filters: string
): Promise<FilesReadonlyListItemsInFolderReturn> => {
  const nodeTree = await _loadNodeTree(client)

  return await _enumerateGoogleDriveAndBuildNodeTree({ driveClient, client, nextToken, filters, nodeTree })
}

const _enumerateGoogleDriveAndBuildNodeTree = async ({
  driveClient,
  client,
  nextToken,
  filters,
  nodeTree,
}: {
  driveClient: DriveClient
  client: FilesReadonlyListItemsInFolderProps['client']
  nextToken: string | undefined
  filters: string
  nodeTree: GoogleDriveNodeTree
}): Promise<FilesReadonlyListItemsInFolderReturn> => {
  const { files, nextToken: newNextToken } = await driveClient.getChildrenSubset({
    folderId: 'root',
    extraQuery: filters,
    nextToken,
  })

  for (const item of files ?? []) {
    nodeTree.upsertNode(item as GoogleDriveNode)
  }

  await _saveNodeTree(client, newNextToken ? nodeTree : nodeTree.removeAllEmptyFoldersRecursively())

  return { items: [], meta: { nextToken: newNextToken ?? _getNextTokenForChildIndex(0) } }
}

const _saveNodeTree = async (client: bp.Client, nodeTree: GoogleDriveNodeTree): Promise<void> => {
  await client.uploadFile({
    key: GOOGLE_DRIVE_TREE_FILE_KEY,
    content: nodeTree.toJSON(),
  })
}
