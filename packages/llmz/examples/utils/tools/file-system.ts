import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { ObjectInstance, Tool } from 'llmz'

const sanitizePath = (path: string) => {
  // Remove leading/trailing slashes and replace multiple slashes with a single slash
  path = path.replace(/(^\/+|\/+$)/g, '').replace(/\/{2,}/g, '/')
  // Allow only alphanumeric, underscore, hyphen, and slashes
  path = path.replace(/[^a-zA-Z0-9_\-\\/\\.]/g, '')
  // Ensure the path does not start with a slash
  path = path.startsWith('/') ? path : `/${path}`
  // Ensure the path does not end with a slash
  path = path.endsWith('/') ? path.slice(0, -1) : path
  // Ensure the path does not contain consecutive slashes
  path = path.replace(/\/{2,}/g, '/')
  // Ensure the path does not contain a leading dot
  path = path.replace(/^\.\//, '')
  // Ensure the path does not contain a trailing dot
  path = path.replace(/\/\.$/, '')

  return path.toLowerCase().trim()
}

const getPathFolder = (path: string) => {
  const parts = path.split('/')
  parts.pop() // Remove the last part (file name)
  return parts.join('/') || '/'
}

const parseFilePath = (path: string) => {
  if (!path || typeof path !== 'string') {
    throw new Error(`Invalid file path: "${path}". Path must be a non-empty string.`)
  }

  if (path.length > 255) {
    throw new Error(`Invalid file path: "${path}". Path length exceeds 255 characters.`)
  }

  const sanitizedPath = sanitizePath(path)

  if (!sanitizedPath.length) {
    throw new Error(`Invalid file path: "${path}". Path cannot be empty.`)
  }

  const folder = getPathFolder(sanitizedPath)
  const fileName = sanitizedPath.split('/').pop()?.trim() || ''

  if (!fileName.length) {
    throw new Error(`Invalid file path: "${path}". File name cannot be empty.`)
  }

  if (fileName.length && !fileName.includes('.')) {
    throw new Error(`Invalid file path: "${fileName}". File name must contain an extension.`)
  }

  return {
    path: sanitizedPath,
    folder,
    file: fileName,
  }
}

export const makeFileSystem = (client: Client) =>
  new ObjectInstance({
    name: 'fs',
    description: 'File system operations',
    tools: [
      new Tool({
        name: 'readFile',
        description: 'Read a file from the file system',
        input: z.string().describe('File path to read'),
        output: z.string().describe('File content'),
        handler: async (path) => {
          const { path: key } = parseFilePath(path)

          const { file } = await client.getFile({
            id: key,
          })

          return await fetch(file.url).then((res) => res.text())
        },
      }),

      new Tool({
        name: 'writeFile',
        description: 'Write a file to the file system',
        input: z.object({
          path: z.string().describe('File path to write'),
          content: z.string().describe('File content to write'),
        }),
        handler: async (input) => {
          const { path, file, folder } = parseFilePath(input.path)

          await client.uploadFile({
            key: path,
            content: input.content,
            accessPolicies: ['public_content'],
            publicContentImmediatelyAccessible: true,
            tags: {
              purpose: 'file-system',
              folder: folder || '/',
              name: file,
            },
          })
        },
      }),

      new Tool({
        name: 'listFiles',
        description: 'Write a file to the file system',
        input: z.string().describe('Folder path to list files from').default('/'),
        output: z
          .array(
            z.object({
              folder: z.string().describe('Folder path'),
              file: z.string().describe('File name'),
              createdAt: z.string().describe('File creation date'),
              updatedAt: z.string().describe('File last update date'),
              size: z.number().describe('File size in bytes'),
              url: z.string().url().describe('File URL'),
              contentType: z.string().describe('File content type'),
            })
          )
          .describe('List of files in the folder'),
        handler: async (path) => {
          const folder = sanitizePath(path || '/')

          const files = await client.list
            .files({
              sortDirection: 'desc',
              sortField: 'updatedAt',
              tags: {
                purpose: 'file-system',
                folder,
              },
            })
            .collect({ limit: 1000 })

          return files.map((file) => ({
            folder: file.tags?.folder || '/',
            file: file.tags?.name || file.key,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            size: file.size,
            url: file.url,
            contentType: file.contentType,
          }))
        },
      }),

      new Tool({
        name: 'deleteFile',
        description: 'Delete a file from the file system',
        input: z.string().describe('File path to delete'),
        output: z.boolean().describe('True if file was deleted successfully'),
        handler: async (path) => {
          const { path: key } = parseFilePath(path)
          await client.deleteFile({ id: key })
          return true
        },
      }),

      new Tool({
        name: 'moveFile',
        description: 'Rename a file in the file system',
        input: z.object({
          before: z.string().describe('Current file path'),
          after: z.string().describe('New file path'),
        }),
        handler: async ({ before, after }) => {
          const { path: oldKey } = parseFilePath(before)
          const { path: newKey, file, folder } = parseFilePath(after)

          await client.copyFile({
            idOrKey: oldKey,
            destinationKey: newKey,
            overwrite: true,
          })

          await client.deleteFile({ id: oldKey })

          await client.updateFileMetadata({
            id: newKey,
            tags: {
              purpose: 'file-system',
              folder: folder || '/',
              name: file,
            },
          })
        },
      }),
    ],
  })
