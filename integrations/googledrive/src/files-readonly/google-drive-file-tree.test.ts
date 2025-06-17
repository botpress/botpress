import { it, expect, describe } from 'vitest'
import {
  GoogleDriveNodeTree,
  SHARED_DRIVES_ID,
  SHARED_WITH_ME_ID,
  type GoogleDriveNode,
} from './google-drive-file-tree'
import { APP_GOOGLE_FOLDER_MIMETYPE } from '../mime-types'

const DUMMY_ROOT_FOLDER_ID = '0AMKYlhzXYUfqUk9PVA'
const DUMMY_SHARED_DRIVE_ID = '0AJcxkTsZHSqGUk9PVA'

const _createMockTree = () => new GoogleDriveNodeTree({ rootFolderId: DUMMY_ROOT_FOLDER_ID })

const _createMockFile = (overrides: Partial<GoogleDriveNode> = {}): GoogleDriveNode => ({
  id: 'example123',
  name: 'example.txt',
  mimeType: 'text/plain',
  trashed: false,
  version: '1',
  modifiedTime: '2025-01-01T00:00:00.000Z',
  shared: false,
  ...overrides,
})

const _createMockFolder = (overrides: Partial<GoogleDriveNode> = {}): GoogleDriveNode => ({
  id: 'folder123',
  name: 'Example Folder',
  mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
  trashed: false,
  version: '1',
  modifiedTime: '2025-01-01T00:00:00.000Z',
  shared: false,
  ...overrides,
})

describe.concurrent('GoogleDriveFileTree', () => {
  it('should create a root node with the correct properties', () => {
    // Arrange
    const tree = _createMockTree()

    // Act
    const root = tree.getRootNode()

    // Assert
    expect(root).toMatchObject({
      id: DUMMY_ROOT_FOLDER_ID,
      name: 'My Drive',
      mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
    })
  })

  it("should correctly add a folder that's a direct child of 'My Drive'", () => {
    // Arrange
    const tree = _createMockTree()
    const folder = _createMockFolder({
      parents: [DUMMY_ROOT_FOLDER_ID],
      id: '1subfolder123',
      name: 'Work Documents',
    })

    // Act
    tree.upsertNode(folder)
    const root = tree.getRootNode()

    // Assert
    expect(root.children).toHaveLength(1)
    expect(root).toMatchObject({
      children: [folder],
    })
  })

  it("should correctly add a folder that's a nested child of 'My Drive'", () => {
    // Arrange
    const tree = _createMockTree()
    const parentId = '1parent123'
    const nestedFolder = _createMockFolder({
      parents: [parentId],
      id: '1nested123',
      name: 'Nested Folder',
    })

    // Act
    tree.upsertNode(nestedFolder)
    const root = tree.getRootNode()

    // Assert
    expect(root).toMatchObject({
      children: [
        expect.objectContaining({
          id: parentId,
          name: `[${parentId}]`,
          mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
          children: [nestedFolder],
        }),
      ],
    })
  })

  it("should correctly add a folder that's a direct child of a shared drive", () => {
    // Arrange
    const tree = _createMockTree()
    const sharedDriveFolder = _createMockFolder({
      parents: [DUMMY_SHARED_DRIVE_ID],
      id: '1shared123',
      name: 'Team Documents',
      driveId: DUMMY_SHARED_DRIVE_ID,
    })

    // Act
    tree.upsertNode(sharedDriveFolder)
    const root = tree.getRootNode()

    // Assert
    expect(root).toMatchObject({
      children: [
        expect.objectContaining({
          id: SHARED_DRIVES_ID,
          name: 'Shared drives',
          mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
          children: [
            expect.objectContaining({
              id: DUMMY_SHARED_DRIVE_ID,
              name: `[${DUMMY_SHARED_DRIVE_ID}]`,
              mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
              children: [expect.objectContaining(sharedDriveFolder)],
            }),
          ],
        }),
      ],
    })
  })

  it("should correctly add a folder that's a nested child of a shared drive", () => {
    // Arrange
    const tree = _createMockTree()
    const parentId = '1sharedparent123'
    const sharedDriveFolder = _createMockFolder({
      parents: [parentId],
      id: '1sharednested123',
      name: 'Project Files',
      driveId: DUMMY_SHARED_DRIVE_ID,
    })

    // Act
    tree.upsertNode(sharedDriveFolder)
    const root = tree.getRootNode()

    // Assert
    expect(root).toMatchObject({
      children: [
        expect.objectContaining({
          id: SHARED_DRIVES_ID,
          name: 'Shared drives',
          mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
          children: [
            expect.objectContaining({
              id: DUMMY_SHARED_DRIVE_ID,
              name: `[${DUMMY_SHARED_DRIVE_ID}]`,
              mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
              children: [
                expect.objectContaining({
                  id: parentId,
                  name: `[${parentId}]`,
                  mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
                  children: [expect.objectContaining(sharedDriveFolder)],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  })

  it("should correctly add a folder that's a direct child of 'Shared with me'", () => {
    // Arrange
    const tree = _createMockTree()
    const sharedWithMeFolder = _createMockFolder({
      id: '1sharedwithme123',
      name: 'Collaboration Folder',
      sharedWithMeTime: '2024-11-20T20:32:17.302Z',
      shared: true,
    })

    // Act
    tree.upsertNode(sharedWithMeFolder)
    const root = tree.getRootNode()

    // Assert
    expect(root).toMatchObject({
      children: [
        expect.objectContaining({
          id: SHARED_WITH_ME_ID,
          name: 'Shared with me',
          mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
          children: [sharedWithMeFolder],
        }),
      ],
    })
  })

  it("should correctly add a folder that's a nested child of 'Shared with me'", () => {
    // Arrange
    const tree = _createMockTree()
    const sharedWithMeParentFolder = _createMockFolder({
      id: '1sharedparent123',
      name: 'Main Project',
      sharedWithMeTime: '2024-11-20T20:32:17.302Z',
      shared: true,
    })
    const nestedSharedWithMeFolder = _createMockFolder({
      parents: [sharedWithMeParentFolder.id],
      id: '1sharednested123',
      name: 'Subfolder',
      shared: true,
    })

    // Act
    tree.upsertNode(sharedWithMeParentFolder)
    tree.upsertNode(nestedSharedWithMeFolder)
    const root = tree.getRootNode()

    // Assert
    expect(root).toMatchObject({
      children: [
        expect.objectContaining({
          id: SHARED_WITH_ME_ID,
          name: 'Shared with me',
          mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
          children: [
            expect.objectContaining({
              ...sharedWithMeParentFolder,
              children: [expect.objectContaining(nestedSharedWithMeFolder)],
            }),
          ],
        }),
      ],
    })
  })

  describe.concurrent('automatic rebalancing', () => {
    it("should correctly rebalance to 'Shared with me' when previously under 'My Drive'", () => {
      // Arrange
      const tree = _createMockTree()
      const sharedWithMeParentFolder = _createMockFolder({
        id: '1rebalanceparent123',
        name: 'Rebalance Test',
        sharedWithMeTime: '2024-11-20T20:32:17.302Z',
        shared: true,
      })
      const nestedSharedWithMeFolder = _createMockFolder({
        parents: [sharedWithMeParentFolder.id],
        id: '1rebalancenested123',
        name: 'Nested Test',
        shared: true,
      })

      // Act
      tree.upsertNode(nestedSharedWithMeFolder)
      tree.upsertNode(sharedWithMeParentFolder)
      const root = tree.getRootNode()

      // Assert
      expect(root).toMatchObject({
        children: [
          expect.objectContaining({
            id: SHARED_WITH_ME_ID,
            name: 'Shared with me',
            mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
            children: [
              expect.objectContaining({
                ...sharedWithMeParentFolder,
                children: [expect.objectContaining(nestedSharedWithMeFolder)],
              }),
            ],
          }),
        ],
      })
    })

    it("should correctly rebalance from a stub subfolder under 'Shared drives' to a known folder", () => {
      // Arrange
      const tree = _createMockTree()
      const parentId = '1stubparent123'
      const sharedDriveSubItem = _createMockFile({
        parents: [parentId],
        id: '1stubitem123',
        name: 'image.jpg',
        mimeType: 'image/jpeg',
        driveId: DUMMY_SHARED_DRIVE_ID,
        md5Checksum: 'abc123def456',
        sha256Checksum: 'def456abc123',
        size: '2995372',
      })
      const sharedDriveParentFolder = _createMockFolder({
        parents: [DUMMY_SHARED_DRIVE_ID],
        id: parentId,
        name: 'Media Files',
        driveId: DUMMY_SHARED_DRIVE_ID,
      })

      // Act
      tree.upsertNode(sharedDriveSubItem)
      tree.upsertNode(sharedDriveParentFolder)
      const root = tree.getRootNode()

      // Assert
      expect(root).toMatchObject({
        children: [
          expect.objectContaining({
            id: SHARED_DRIVES_ID,
            name: 'Shared drives',
            mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
            children: [
              expect.objectContaining({
                id: DUMMY_SHARED_DRIVE_ID,
                name: `[${DUMMY_SHARED_DRIVE_ID}]`,
                mimeType: APP_GOOGLE_FOLDER_MIMETYPE,
                children: [
                  expect.objectContaining({
                    ...sharedDriveParentFolder,
                    children: [expect.objectContaining(sharedDriveSubItem)],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    })
  })
})
