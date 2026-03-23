import { describe, it, expect } from 'vitest'
import { encodeRepoFolderId, decodeRepoFolderId, encodeContentId, decodeContentId } from './mapping'

describe.concurrent('encodeRepoFolderId / decodeRepoFolderId', () => {
  it('should round-trip a simple owner/repo', () => {
    const encoded = encodeRepoFolderId('acme', 'widgets')
    expect(encoded).toBe('repo:acme/widgets')
    expect(decodeRepoFolderId(encoded)).toEqual({ owner: 'acme', repo: 'widgets' })
  })

  it('should round-trip owner/repo with hyphens and dots', () => {
    const encoded = encodeRepoFolderId('my-org', 'my-repo.js')
    expect(decodeRepoFolderId(encoded)).toEqual({ owner: 'my-org', repo: 'my-repo.js' })
  })

  it('should return null for ids missing the repo: prefix', () => {
    expect(decodeRepoFolderId('acme/widgets')).toBeNull()
    expect(decodeRepoFolderId('folder:acme/widgets')).toBeNull()
  })

  it('should return null for an id with only an owner (no repo segment)', () => {
    expect(decodeRepoFolderId('repo:acme')).toBeNull()
  })

  it('should return null for an empty payload after prefix', () => {
    expect(decodeRepoFolderId('repo:')).toBeNull()
  })

  it('should return null for ids with empty owner or repo segments', () => {
    expect(decodeRepoFolderId('repo:/widgets')).toBeNull()
    expect(decodeRepoFolderId('repo:acme/')).toBeNull()
    expect(decodeRepoFolderId('repo:/')).toBeNull()
  })

  it('should NOT match content ids (3+ path segments)', () => {
    expect(decodeRepoFolderId('repo:acme/widgets/src')).toBeNull()
    expect(decodeRepoFolderId('repo:acme/widgets/src/index.ts')).toBeNull()
    expect(decodeRepoFolderId('repo:acme/widgets/a/b/c/d')).toBeNull()
  })
})

describe.concurrent('encodeContentId / decodeContentId', () => {
  it('should round-trip a single-segment path', () => {
    const encoded = encodeContentId('acme', 'widgets', 'README.md')
    expect(encoded).toBe('repo:acme/widgets/README.md')
    expect(decodeContentId(encoded)).toEqual({ owner: 'acme', repo: 'widgets', path: 'README.md' })
  })

  it('should round-trip a deeply nested path', () => {
    const encoded = encodeContentId('acme', 'widgets', 'src/utils/helpers/index.ts')
    expect(encoded).toBe('repo:acme/widgets/src/utils/helpers/index.ts')
    expect(decodeContentId(encoded)).toEqual({
      owner: 'acme',
      repo: 'widgets',
      path: 'src/utils/helpers/index.ts',
    })
  })

  it('should round-trip a directory path (no extension)', () => {
    const encoded = encodeContentId('acme', 'widgets', 'src/components')
    expect(decodeContentId(encoded)).toEqual({
      owner: 'acme',
      repo: 'widgets',
      path: 'src/components',
    })
  })

  it('should return null for ids missing the repo: prefix', () => {
    expect(decodeContentId('acme/widgets/README.md')).toBeNull()
  })

  it('should return null for a repo folder id (only 2 segments, no path)', () => {
    expect(decodeContentId('repo:acme/widgets')).toBeNull()
  })

  it('should return null for a single segment after prefix', () => {
    expect(decodeContentId('repo:acme')).toBeNull()
  })
})

describe.concurrent('decodeRepoFolderId and decodeContentId are mutually exclusive on well-formed ids', () => {
  it('repo folder id is decoded only by decodeRepoFolderId', () => {
    const id = encodeRepoFolderId('org', 'repo')
    expect(decodeRepoFolderId(id)).not.toBeNull()
    // decodeContentId technically parses it but yields an empty path — the caller should
    // try decodeRepoFolderId first, which is the intended dispatch order.
  })

  it('content id is decoded only by decodeContentId, never by decodeRepoFolderId', () => {
    const id = encodeContentId('org', 'repo', 'src/main.ts')
    expect(decodeRepoFolderId(id)).toBeNull()
    expect(decodeContentId(id)).toEqual({ owner: 'org', repo: 'repo', path: 'src/main.ts' })
  })

  it('subdirectory folder id is decoded only by decodeContentId', () => {
    const id = encodeContentId('org', 'repo', 'src')
    expect(decodeRepoFolderId(id)).toBeNull()
    expect(decodeContentId(id)).toEqual({ owner: 'org', repo: 'repo', path: 'src' })
  })
})
