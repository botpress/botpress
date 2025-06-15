import { APP_GOOGLE_FOLDER_MIMETYPE } from '../mime-types'

export type GoogleDriveNode = {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  children?: GoogleDriveNode[]
  trashed?: boolean
  version?: string
  modifiedTime?: string
  shared?: boolean
  driveId?: string
  size?: string
  md5Checksum?: string
  sha256Checksum?: string
  sharedWithMeTime?: string
}

export const SHARED_WITH_ME_ID = 'sharedWithMe'
export const SHARED_DRIVES_ID = 'sharedDrives'

export class GoogleDriveNodeTree {
  private readonly _nodeByIdMap = new Map<string, GoogleDriveNode>()
  private readonly _childIdsByParentIdMap = new Map<string, Set<string>>()
  private readonly _rootFolderId: string

  public constructor({ rootFolderId }: { rootFolderId: string }) {
    this._rootFolderId = rootFolderId
    this._createMyDriveRootNode()
  }

  public getRootNode(): GoogleDriveNode {
    return this._buildNodeWithAllDescendants(this._rootFolderId)
  }

  public getNodeById(nodeId: string): GoogleDriveNode | undefined {
    return this._nodeByIdMap.get(nodeId)
  }

  public upsertNode(nodeToInsert: GoogleDriveNode): this {
    if (nodeToInsert.id !== this._rootFolderId) {
      const existingNodeWithSameId = this._nodeByIdMap.get(nodeToInsert.id)
      const existingChildIdsForThisNode = new Set(this._childIdsByParentIdMap.get(nodeToInsert.id))

      this._removeNodeFromItsPreviousParent(existingNodeWithSameId)
      this._storeNodeInIdMap(nodeToInsert)
      this._addNodeToItsNewParent(nodeToInsert)
      this._preserveExistingChildrenForFolders(nodeToInsert, existingChildIdsForThisNode)
    }

    this._upsertChildrenForNode(nodeToInsert)
    return this
  }

  public removeAllEmptyFoldersRecursively(): this {
    const emptyFolderIds = this._findAllEmptyFolderIds()
    this._removeEmptyFoldersFromTheirParents(emptyFolderIds)
    this._deleteEmptyFoldersFromMaps(emptyFolderIds)
    return this
  }

  private _upsertChildrenForNode(nodeToInsert: GoogleDriveNode): void {
    for (const child of nodeToInsert.children ?? []) {
      this.upsertNode(child)
    }
  }

  private _createMyDriveRootNode(): void {
    this._nodeByIdMap.set(this._rootFolderId, {
      id: this._rootFolderId,
      name: 'My Drive',
      mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
    })
    this._childIdsByParentIdMap.set(this._rootFolderId, new Set())
  }

  private _removeNodeFromItsPreviousParent(existingNodeWithSameId: GoogleDriveNode | undefined): void {
    if (!existingNodeWithSameId) return
    const previousParentId = this._determineEffectiveParentId(existingNodeWithSameId)
    this._childIdsByParentIdMap.get(previousParentId)?.delete(existingNodeWithSameId.id)
  }

  private _storeNodeInIdMap(nodeToStore: GoogleDriveNode): void {
    this._nodeByIdMap.set(nodeToStore.id, { ...nodeToStore })
  }

  private _addNodeToItsNewParent(nodeToAdd: GoogleDriveNode): void {
    const newParentId = this._determineEffectiveParentId(nodeToAdd)
    this._ensureParentNodeExists(newParentId, nodeToAdd)
    this._ensureChildSetExistsForParent(newParentId)
    this._childIdsByParentIdMap.get(newParentId)!.add(nodeToAdd.id)
  }

  private _preserveExistingChildrenForFolders(nodeToCheck: GoogleDriveNode, existingChildIds: Set<string>): void {
    if (nodeToCheck.mimeType !== APP_GOOGLE_FOLDER_MIMETYPE) return

    this._ensureChildSetExistsForParent(nodeToCheck.id)
    if (existingChildIds.size > 0) {
      this._childIdsByParentIdMap.set(nodeToCheck.id, existingChildIds)
    }
  }

  private _ensureChildSetExistsForParent(parentNodeId: string): void {
    if (!this._childIdsByParentIdMap.has(parentNodeId)) {
      this._childIdsByParentIdMap.set(parentNodeId, new Set())
    }
  }

  private _findAllEmptyFolderIds(): Set<string> {
    const emptyFolderIds = new Set<string>()
    let foundNewEmptyFoldersInThisIteration = true

    while (foundNewEmptyFoldersInThisIteration) {
      foundNewEmptyFoldersInThisIteration = false
      foundNewEmptyFoldersInThisIteration = this._findEmptyFoldersInCurrentIteration(emptyFolderIds)
      this._removeEmptyFoldersFromTheirParents(emptyFolderIds)
    }

    return emptyFolderIds
  }

  private _findEmptyFoldersInCurrentIteration(alreadyFoundEmptyFolderIds: Set<string>): boolean {
    let foundNewEmptyFolderInThisIteration = false

    for (const [potentialParentId, childIdSet] of this._childIdsByParentIdMap.entries()) {
      const potentialParentNode = this._nodeByIdMap.get(potentialParentId)
      if (!potentialParentNode || alreadyFoundEmptyFolderIds.has(potentialParentId)) continue

      if (this._isFolderEmptyOfChildren(potentialParentNode, childIdSet)) {
        alreadyFoundEmptyFolderIds.add(potentialParentId)
        foundNewEmptyFolderInThisIteration = true
      }
    }

    return foundNewEmptyFolderInThisIteration
  }

  private _isFolderEmptyOfChildren(nodeToCheck: GoogleDriveNode, childIdSet: Set<string>): boolean {
    return nodeToCheck.mimeType === APP_GOOGLE_FOLDER_MIMETYPE && childIdSet.size === 0
  }

  private _removeEmptyFoldersFromTheirParents(emptyFolderIds: Set<string>): void {
    for (const emptyFolderId of emptyFolderIds) {
      const emptyFolderNode = this._nodeByIdMap.get(emptyFolderId)
      if (!emptyFolderNode) continue

      const parentIdOfEmptyFolder = this._determineEffectiveParentId(emptyFolderNode)
      this._childIdsByParentIdMap.get(parentIdOfEmptyFolder)?.delete(emptyFolderId)
    }
  }

  private _deleteEmptyFoldersFromMaps(emptyFolderIds: Set<string>): void {
    for (const emptyFolderId of emptyFolderIds) {
      const emptyFolderNode = this._nodeByIdMap.get(emptyFolderId)
      if (!emptyFolderNode) continue

      const parentIdOfEmptyFolder = this._determineEffectiveParentId(emptyFolderNode)
      this._childIdsByParentIdMap.get(parentIdOfEmptyFolder)?.delete(emptyFolderId)

      this._nodeByIdMap.delete(emptyFolderId)
      this._childIdsByParentIdMap.delete(emptyFolderId)
    }
  }

  private _buildNodeWithAllDescendants(nodeId: string): GoogleDriveNode {
    const requestedNode = this._nodeByIdMap.get(nodeId)
    if (!requestedNode) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const allDescendantNodes = this._buildSortedDescendantNodes(nodeId)

    return {
      ...structuredClone(requestedNode),
      children: allDescendantNodes.length > 0 ? allDescendantNodes : undefined,
    }
  }

  private _buildSortedDescendantNodes(parentNodeId: string): GoogleDriveNode[] {
    const childIdSet = this._childIdsByParentIdMap.get(parentNodeId)
    if (!childIdSet || childIdSet.size === 0) return []

    return Array.from(childIdSet)
      .map((childId) => this._buildNodeWithAllDescendants(childId))
      .sort((nodeA, nodeB) => nodeA.name.localeCompare(nodeB.name))
  }

  private _determineEffectiveParentId(nodeToAnalyze: GoogleDriveNode): string {
    if (nodeToAnalyze.sharedWithMeTime) {
      return this._determineParentIdForSharedWithMeNode(nodeToAnalyze)
    }

    if (nodeToAnalyze.driveId) {
      return this._determineParentIdForSharedDriveNode(nodeToAnalyze)
    }

    return nodeToAnalyze.parents?.[0] ?? this._rootFolderId
  }

  private _determineParentIdForSharedWithMeNode(sharedWithMeNode: GoogleDriveNode): string {
    this._ensureSpecialFolderNodeExists(SHARED_WITH_ME_ID, 'Shared with me')

    if (sharedWithMeNode.parents?.[0]) {
      this._ensureParentExistsWithinSharedWithMeFolder(sharedWithMeNode.parents[0])
      return sharedWithMeNode.parents[0]
    }

    return SHARED_WITH_ME_ID
  }

  private _determineParentIdForSharedDriveNode(sharedDriveNode: GoogleDriveNode): string {
    this._ensureSpecialFolderNodeExists(SHARED_DRIVES_ID, 'Shared drives')
    this._ensureSharedDriveRootNodeExists(sharedDriveNode.driveId!, sharedDriveNode.driveId!)

    return sharedDriveNode.parents?.[0] ?? sharedDriveNode.driveId!
  }

  private _ensureParentExistsWithinSharedWithMeFolder(parentIdWithinSharedWithMe: string): void {
    if (this._nodeByIdMap.has(parentIdWithinSharedWithMe)) return

    this._createPlaceholderFolderNode(parentIdWithinSharedWithMe, [SHARED_WITH_ME_ID])
    this._ensureChildSetExistsForParent(SHARED_WITH_ME_ID)
    this._childIdsByParentIdMap.get(SHARED_WITH_ME_ID)!.add(parentIdWithinSharedWithMe)
  }

  private _ensureParentNodeExists(parentIdToCheck: string, childNodeRequiringParent: GoogleDriveNode): void {
    if (this._nodeByIdMap.has(parentIdToCheck)) return
    if (this._isSpecialSystemFolder(parentIdToCheck)) return

    const placeholderParentId = this._determinePlaceholderParentIdForMissingNode(childNodeRequiringParent)
    this._createPlaceholderFolderNode(parentIdToCheck, [placeholderParentId])
    this._ensureChildSetExistsForParent(placeholderParentId)
    this._childIdsByParentIdMap.get(placeholderParentId)!.add(parentIdToCheck)
  }

  private _isSpecialSystemFolder(nodeIdToCheck: string): boolean {
    return (
      nodeIdToCheck === SHARED_WITH_ME_ID || nodeIdToCheck === SHARED_DRIVES_ID || nodeIdToCheck === this._rootFolderId
    )
  }

  private _determinePlaceholderParentIdForMissingNode(childNodeNeedingParent: GoogleDriveNode): string {
    if (childNodeNeedingParent.sharedWithMeTime) {
      this._ensureSpecialFolderNodeExists(SHARED_WITH_ME_ID, 'Shared with me')
      return SHARED_WITH_ME_ID
    }

    if (childNodeNeedingParent.driveId) {
      this._ensureSpecialFolderNodeExists(SHARED_DRIVES_ID, 'Shared drives')
      this._ensureSharedDriveRootNodeExists(childNodeNeedingParent.driveId, childNodeNeedingParent.driveId)
      return childNodeNeedingParent.driveId
    }

    return this._rootFolderId
  }

  private _createPlaceholderFolderNode(placeholderNodeId: string, parentIds: string[]): void {
    this._nodeByIdMap.set(placeholderNodeId, {
      id: placeholderNodeId,
      name: `[${placeholderNodeId}]`,
      mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
      parents: parentIds,
    })
    this._childIdsByParentIdMap.set(placeholderNodeId, new Set())
  }

  private _ensureSpecialFolderNodeExists(specialFolderId: string, displayName: string): void {
    if (this._nodeByIdMap.has(specialFolderId)) return

    this._nodeByIdMap.set(specialFolderId, {
      id: specialFolderId,
      name: displayName,
      mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
    })
    this._childIdsByParentIdMap.set(specialFolderId, new Set())
    this._childIdsByParentIdMap.get(this._rootFolderId)!.add(specialFolderId)
  }

  private _ensureSharedDriveRootNodeExists(sharedDriveRootNodeId: string, sharedDriveId: string): void {
    if (this._nodeByIdMap.has(sharedDriveRootNodeId)) return

    this._nodeByIdMap.set(sharedDriveRootNodeId, {
      id: sharedDriveRootNodeId,
      name: `[${sharedDriveId}]`,
      mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
      parents: [SHARED_DRIVES_ID],
    })
    this._childIdsByParentIdMap.set(sharedDriveRootNodeId, new Set())
    this._childIdsByParentIdMap.get(SHARED_DRIVES_ID)!.add(sharedDriveRootNodeId)
  }

  public toJSON(): string {
    return JSON.stringify(this.getRootNode())
  }

  public static fromJSON(json: string): GoogleDriveNodeTree {
    const rootNode = JSON.parse(json)
    return new GoogleDriveNodeTree({ rootFolderId: rootNode.id }).upsertNode(rootNode)
  }
}
