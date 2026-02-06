import { describe, it, expect } from 'vitest'
import { hasEnabledFolders } from './has-enabled-folders'

describe.concurrent('hasEnabledFolders', () => {
  it('should return true when at least one folder has syncNewFiles enabled', () => {
    const settings = {
      'kb-1': {
        'folder-1': { syncNewFiles: true, path: '/path/to/folder1' },
        'folder-2': { syncNewFiles: false, path: '/path/to/folder2' },
      },
      'kb-2': {
        'folder-3': { syncNewFiles: false, path: '/path/to/folder3' },
      },
    }

    expect(hasEnabledFolders(settings)).toBe(true)
  })

  it('should return false when all folders have syncNewFiles disabled', () => {
    const settings = {
      'kb-1': {
        'folder-1': { syncNewFiles: false, path: '/path/to/folder1' },
        'folder-2': { syncNewFiles: false, path: '/path/to/folder2' },
      },
      'kb-2': {
        'folder-3': { syncNewFiles: false, path: '/path/to/folder3' },
      },
    }

    expect(hasEnabledFolders(settings)).toBe(false)
  })

  it('should return false when settings are empty', () => {
    const settings = {}

    expect(hasEnabledFolders(settings)).toBe(false)
  })

  it('should return true when multiple folders have syncNewFiles enabled', () => {
    const settings = {
      'kb-1': {
        'folder-1': { syncNewFiles: true, path: '/path/to/folder1' },
        'folder-2': { syncNewFiles: true, path: '/path/to/folder2' },
      },
      'kb-2': {
        'folder-3': { syncNewFiles: true, path: '/path/to/folder3' },
      },
    }

    expect(hasEnabledFolders(settings)).toBe(true)
  })

  it('should return true when only one folder in one KB has syncNewFiles enabled', () => {
    const settings = {
      'kb-1': {
        'folder-1': { syncNewFiles: true, path: '/path/to/folder1' },
      },
    }

    expect(hasEnabledFolders(settings)).toBe(true)
  })

  it('should handle folders without path property', () => {
    const settings = {
      'kb-1': {
        'folder-1': { syncNewFiles: true },
        'folder-2': { syncNewFiles: false },
      },
    }

    expect(hasEnabledFolders(settings)).toBe(true)
  })

  it('should return false when KB exists but has no folders', () => {
    const settings = {
      'kb-1': {},
    }

    expect(hasEnabledFolders(settings)).toBe(false)
  })
})
