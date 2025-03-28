import { describe, it, expect } from 'vitest'
import { FileTree } from './file-tree'
import { File as FileEntity, Folder as FolderEntity, Deleted as DeletedEntity } from '../../definitions'

const createFile = (path: string, overrides: Partial<FileEntity.InferredType> = {}): FileEntity.InferredType => ({
  path,
  id: `file-${path}`,
  itemType: 'file',
  name: path.split('/').pop() ?? '',
  isDeleted: false,
  isShared: false,
  revision: 'rev1',
  size: 100,
  fileHash: 'hash123',
  isDownloadable: true,
  modifiedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

const createFolder = (path: string, overrides: Partial<FolderEntity.InferredType> = {}): FolderEntity.InferredType => ({
  path,
  id: `folder-${path}`,
  itemType: 'folder',
  name: path.split('/').pop() ?? '',
  isDeleted: false,
  isShared: false,
  ...overrides,
})

const createDeletedItem = (path: string): DeletedEntity.InferredType => ({
  path,
  itemType: 'deleted',
  name: path.split('/').pop() ?? '',
  isDeleted: true,
})

describe.concurrent('FileTree', () => {
  describe.concurrent('getItems', () => {
    it('returns all items in the tree', () => {
      // Arrange
      const fileTree = new FileTree()
      const file = createFile('/folder/file.txt')
      const folder = createFolder('/folder')

      // Act
      fileTree.pushItem(folder)
      fileTree.pushItem(file)

      // Assert
      const items = fileTree.getItems()
      expect(items).toHaveLength(2)
      expect(items).toStrictEqual(expect.arrayContaining([file, folder]))
    })
  })

  describe.concurrent('pushItem', () => {
    describe.concurrent('with file items', () => {
      it('adds file to tree', () => {
        // Arrange
        const fileTree = new FileTree()
        const file = createFile('/file.txt')

        // Act
        const diff = fileTree.pushItem(file)

        // Assert
        expect(diff).toStrictEqual({
          added: [file],
          updated: [],
          deleted: [],
        })
        expect(fileTree.getItems()).toStrictEqual([file])
      })

      it('updates file if it already exists', () => {
        // Arrange
        const fileTree = new FileTree()
        const originalFile = createFile('/file.txt', { revision: 'v1', size: 100 })
        const updatedFile = createFile('/file.txt', { revision: 'v2', size: 200 })
        fileTree.pushItem(originalFile)

        // Act
        const diff = fileTree.pushItem(updatedFile)

        // Assert
        expect(diff).toStrictEqual({
          added: [],
          updated: [originalFile],
          deleted: [],
        })
        expect(fileTree.getItems()).toStrictEqual([updatedFile])
      })

      it('replaces folder with file and removes children', () => {
        // Arrange
        const fileTree = new FileTree()
        const folder = createFolder('/folder')
        const childFile = createFile('/folder/child.txt')
        const newFile = createFile('/folder', { id: 'newfile' })
        fileTree.pushItem(folder)
        fileTree.pushItem(childFile)

        // Act
        const diff = fileTree.pushItem(newFile)

        // Assert
        expect(diff).toStrictEqual({
          added: [newFile],
          updated: [],
          deleted: expect.arrayContaining([folder, childFile]),
        })
        expect(fileTree.getItems()).toStrictEqual([newFile])
      })
    })

    describe.concurrent('with folder items', () => {
      it('adds folder to tree', () => {
        // Arrange
        const fileTree = new FileTree()
        const folder = createFolder('/folder')

        // Act
        const diff = fileTree.pushItem(folder)

        // Assert
        expect(diff).toStrictEqual({
          added: [folder],
          updated: [],
          deleted: [],
        })
        expect(fileTree.getItems()).toStrictEqual([folder])
      })

      it('updates folder if it already exists', () => {
        // Arrange
        const fileTree = new FileTree()
        const originalFolder = createFolder('/folder', { isShared: false })
        const updatedFolder = createFolder('/folder', { isShared: true })
        fileTree.pushItem(originalFolder)

        // Act
        const diff = fileTree.pushItem(updatedFolder)

        // Assert
        expect(diff).toStrictEqual({
          added: [],
          updated: [originalFolder],
          deleted: [],
        })
        expect(fileTree.getItems()).toStrictEqual([updatedFolder])
      })

      it('replaces file with new folder but keeps children', () => {
        // Arrange
        const fileTree = new FileTree()
        const file = createFile('/folder')
        const childFile = createFile('/folder/child.txt')
        const newFolder = createFolder('/folder')
        fileTree.pushItem(file)
        fileTree.pushItem(childFile)

        // Act
        const diff = fileTree.pushItem(newFolder)

        // Assert
        expect(diff).toStrictEqual({
          added: [newFolder],
          updated: [],
          deleted: [file],
        })
        expect(fileTree.getItems()).toStrictEqual(expect.arrayContaining([newFolder, childFile]))
      })

      it('replaces folder with new folder but keeps children', () => {
        // Arrange
        const fileTree = new FileTree()
        const folder = createFolder('/folder')
        const childFile = createFile('/folder/child.txt')
        const newFolder = createFolder('/folder')
        fileTree.pushItem(folder)
        fileTree.pushItem(childFile)

        // Act
        const diff = fileTree.pushItem(newFolder)

        // Assert
        expect(diff).toStrictEqual({
          added: [],
          updated: [newFolder],
          deleted: [],
        })
        expect(fileTree.getItems()).toStrictEqual(expect.arrayContaining([newFolder, childFile]))
      })
    })

    describe.concurrent('with deleted items', () => {
      it('removes item and all children', () => {
        // Arrange
        const fileTree = new FileTree()
        const folder = createFolder('/folder')
        const subFolder = createFolder('/folder/subfolder')
        const file1 = createFile('/folder/file1.txt')
        const file2 = createFile('/folder/subfolder/file2.txt')
        const deletedItem = createDeletedItem('/folder')
        fileTree.pushItem(folder)
        fileTree.pushItem(subFolder)
        fileTree.pushItem(file1)
        fileTree.pushItem(file2)

        // Act
        const diff = fileTree.pushItem(deletedItem)

        expect(diff).toStrictEqual({
          added: [],
          updated: [],
          deleted: expect.arrayContaining([folder, subFolder, file1, file2]),
        })
        expect(fileTree.getItems()).toHaveLength(0)
      })

      it('does nothing if item does not exist', () => {
        // Arrange
        const fileTree = new FileTree()
        const file = createFile('/file.txt')
        const deletedItem = createDeletedItem('/nonexistent')
        fileTree.pushItem(file)

        // Act
        const diff = fileTree.pushItem(deletedItem)

        // Assert
        expect(diff).toStrictEqual({
          added: [],
          updated: [],
          deleted: [],
        })
        expect(fileTree.getItems()).toStrictEqual([file])
      })

      it('handles deep nested structure modifications', () => {
        // Arrange
        const fileTree = new FileTree()
        fileTree.pushItem(createFolder('/root'))
        fileTree.pushItem(createFolder('/root/folder1'))
        fileTree.pushItem(createFolder('/root/folder2'))
        fileTree.pushItem(createFile('/root/folder1/file1.txt'))
        fileTree.pushItem(createFile('/root/folder1/file2.txt'))
        fileTree.pushItem(createFile('/root/folder2/file3.txt'))
        expect(fileTree.getItems()).toHaveLength(6)

        // Act
        const diff = fileTree.pushItem(createDeletedItem('/root/folder1'))

        // Assert
        expect(fileTree.getItems()).toStrictEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: '/root' }),
            expect.objectContaining({ path: '/root/folder2' }),
            expect.objectContaining({ path: '/root/folder2/file3.txt' }),
          ])
        )
        expect(diff).toStrictEqual({
          added: [],
          updated: [],
          deleted: expect.arrayContaining([
            expect.objectContaining({ path: '/root/folder1' }),
            expect.objectContaining({ path: '/root/folder1/file1.txt' }),
            expect.objectContaining({ path: '/root/folder1/file2.txt' }),
          ]),
        })
      })
    })
  })
})
