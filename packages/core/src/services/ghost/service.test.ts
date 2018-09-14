import 'bluebird-global'
import { Logger } from 'botpress-module-sdk'
import 'reflect-metadata'

import { createSpyObject, MockObject } from '../../misc/utils'

import { GhostFileRevision, ObjectCache } from '.'
import DBStorageDriver from './db-driver'
import DiskStorageDriver from './disk-driver'
import Ghost from './service'

const BOT_ID = 'bot123'

describe('Ghost Service', () => {
  let ghost: Ghost // tslint:disable-line
  let diskDriver: MockObject<DiskStorageDriver>,
    dbDriver: MockObject<DBStorageDriver>,
    cache: MockObject<ObjectCache>,
    logger: MockObject<Logger>

  beforeEach(() => {
    diskDriver = createSpyObject<DiskStorageDriver>()
    dbDriver = createSpyObject<DBStorageDriver>()
    cache = createSpyObject<ObjectCache>()
    logger = createSpyObject<Logger>()
    ghost = new Ghost(diskDriver.T, dbDriver.T, cache.T, logger.T)
  })

  describe(`Using Disk Driver`, () => {
    beforeEach(async () => {
      await ghost.initialize({
        ghost: { enabled: false }
      })
    })

    it('DB Driver is never ever called', async () => {
      await ghost.global().deleteFile('', '')
      await ghost.global().directoryListing('', '')
      await ghost.global().getPending()
      await ghost.global().getPendingWithContent({ stringifyBinary: true })
      await ghost.global().isFullySynced()
      await ghost.global().readFileAsBuffer('', '')
      await ghost.global().sync([''])
      await ghost.global().upsertFile('', '', '')

      expect(dbDriver.deleteFile).not.toHaveBeenCalled()
      expect(dbDriver.readFile).not.toHaveBeenCalled()
      expect(dbDriver.upsertFile).not.toHaveBeenCalled()

      expect(diskDriver.deleteFile).toHaveBeenCalled()
      expect(diskDriver.readFile).toHaveBeenCalled()
      expect(diskDriver.upsertFile).toHaveBeenCalled()
    })

    it('Reads files from disk', async () => {
      diskDriver.readFile
        .mockReturnValueOnce(new Buffer(''))
        .mockReturnValueOnce(`{ "name": "test" }`)
        .mockReturnValueOnce('Hello')

      const res1 = await ghost.global().readFileAsBuffer('test', 'a.json')
      const res2 = await ghost.global().readFileAsObject<{ name: string }>('test', 'a.json')
      const res3 = await ghost.global().readFileAsString('test', 'a.json')

      expect(res1).toBeInstanceOf(Buffer)
      expect(res2).toHaveProperty('name', 'test')
      expect(res3).toBe('Hello')
    })

    it('Reads file from cache if cached', async () => {
      const json = `{ "name": "test" }`
      cache.has.mockReturnValue(true)
      cache.get.mockReturnValue(json)

      const res1 = await ghost.global().readFileAsBuffer('test', 'a.json')
      const res2 = await ghost.global().readFileAsObject<{ name: string }>('test', 'b.json')
      const res3 = await ghost.global().readFileAsString('test', 'c.json')

      expect(res1).toBe(json)
      expect(res2).toBe(json)
      expect(res3).toBe(json)
    })

    it('Caches the file if not already cached', async () => {
      const json = `{ "name": "test" }`
      cache.has.mockReturnValue(false)

      diskDriver.listRevisions.mockReturnValue([])
      diskDriver.readFile.mockReturnValue(json)

      await ghost.global().readFileAsBuffer('test', 'a.json')
      await ghost.global().readFileAsObject<{ name: string }>('test', 'b.json')

      expect(cache.set).toHaveBeenCalledTimes(3) // because getObject calls getBuffer
      expect(cache.set.mock.calls[0][1]).toBe(json)
      expect(cache.set.mock.calls[1][1]).toBe(json)
      expect(cache.set.mock.calls[2][1]).toHaveProperty('name', 'test') // We cache an actual object
    })

    it('Never has any pending revisions', async () => {
      dbDriver.listRevisions.mockReturnValue([{ file_path: 'abc', revision: 'rev' }]) // Even if DB driver says there are some revisions
      await ghost.forBot(BOT_ID).upsertFile('test', 'a.json', 'Hello') // And that we modify a file

      const revisions = await ghost.global().getPending()
      expect(revisions).toMatchObject({})
    })
  })

  describe('Using DB Driver', async () => {
    beforeEach(() => {
      ghost.initialize({
        ghost: { enabled: true }
      })
    })

    describe('read/write/delete', async () => {
      it('read files uses DB', async () => {
        dbDriver.readFile.mockImplementation(fileName => fileName)
        const content = await ghost.global().readFileAsString('test', 'my/test.json')

        expect(diskDriver.readFile).not.toHaveBeenCalled()
        expect(dbDriver.readFile).toHaveBeenCalled()
        expect(content).toContain('test/my/test.json')
      })
      it('write uses DB', async () => {
        await ghost.global().upsertFile('test', 'test.json', 'my content')

        expect(dbDriver.upsertFile).toHaveBeenCalled()
        expect(dbDriver.upsertFile.mock.calls[0][0]).toContain('test.json')
        expect(dbDriver.upsertFile.mock.calls[0][1]).toContain('my content')
        expect(diskDriver.upsertFile).not.toHaveBeenCalled()
      })
      it('write creates revisions', async () => {
        await ghost.global().upsertFile('test', 'test.json', 'my content')

        expect(dbDriver.upsertFile).toHaveBeenCalled()
        expect(dbDriver.upsertFile.mock.calls[0][2]).toBe(true)
      })
      it('delete operates on DB', async () => {
        await ghost.global().deleteFile('test', 'test.json')

        expect(dbDriver.deleteFile).toHaveBeenCalled()
        expect(diskDriver.deleteFile).not.toHaveBeenCalled()
      })
    })

    describe('directory listing', async () => {
      it('reads files from the DB', async () => {
        await ghost.global().directoryListing('test', '*.json')
        expect(dbDriver.directoryListing).toHaveBeenCalled()
        expect(diskDriver.directoryListing).not.toHaveBeenCalled()
      })
      it('path filters work', async () => {
        dbDriver.directoryListing.mockReturnValue(['test/a.json', 'test/nested/b.json', 'test/c.js'])
        const allFiles = await ghost.global().directoryListing('test')
        const jsonFiles = await ghost.forBot(BOT_ID).directoryListing('test', '*.json')
        const aFile = await ghost.forBot(BOT_ID).directoryListing('test', 'a.json')
        const bFile = await ghost.global().directoryListing('test', '**/NESTED/*') // case-insensitive, ** globs

        expect(allFiles).toHaveLength(3)
        expect(jsonFiles).toHaveLength(2)
        expect(aFile).toHaveLength(1)
        expect(bFile).toHaveLength(1)
      })
    })

    describe('sync', async () => {
      it('if disk is not up to date, mark as dirty and dont sync disk files', async () => {
        const buildRev = n =>
          <GhostFileRevision>{
            path: 'file',
            revision: n
          }

        dbDriver.listRevisions.mockReturnValue(['1', '2', '3'].map(buildRev))
        diskDriver.listRevisions.mockReturnValue(['1', '2'].map(buildRev)) // missing revision "3"

        await ghost.global().sync(['test'])

        // We make sure the user is warned of the dirty state
        expect(logger.warn).toHaveBeenCalled()
        expect(logger.warn.mock.calls[0][0]).toContain('global')

        // Make sure we haven't synced anything
        expect(diskDriver.readFile).not.toHaveBeenCalled()
        expect(diskDriver.directoryListing).not.toHaveBeenCalled()
        expect(dbDriver.upsertFile).not.toHaveBeenCalled()
      })
      it('if disk is up to date, sync disk files', async () => {
        const buildRev = n =>
          <GhostFileRevision>{
            path: 'file',
            revision: n
          }

        dbDriver.listRevisions.mockReturnValue(['1', '2', '3'].map(buildRev))
        diskDriver.listRevisions.mockReturnValue(['1', '2', '3'].map(buildRev)) // All synced!
        diskDriver.readFile.mockReturnValueOnce('FILE A CONTENT')
        diskDriver.readFile.mockReturnValueOnce('FILE D CONTENT')

        dbDriver.directoryListing.mockReturnValue(['test/a.json', 'test/c.json'])
        diskDriver.directoryListing.mockReturnValue(['test/a.json', 'test/d.json'])

        dbDriver.deleteRevision.mockImplementation(() => {
          dbDriver.listRevisions.mockReset()
          dbDriver.listRevisions.mockReturnValue([])
        })

        await ghost.global().sync(['test'])

        // Deleted revisions
        expect(dbDriver.deleteRevision).toHaveBeenCalledTimes(3)

        expect(dbDriver.upsertFile).toHaveBeenCalledTimes(2)

        // Overwritten existing DB file by disk file
        expect(dbDriver.upsertFile.mock.calls[0][0]).toContain('a.json')
        expect(dbDriver.upsertFile.mock.calls[0][1]).toContain('FILE A CONTENT')

        // Added new file (d.js)
        expect(dbDriver.upsertFile.mock.calls[1][0]).toContain('d.json')
        expect(dbDriver.upsertFile.mock.calls[1][1]).toContain('FILE D CONTENT')

        // Deleted file from DB that no longer exists on disk
        expect(dbDriver.deleteFile).toHaveBeenCalledTimes(1)
        expect(dbDriver.deleteFile.mock.calls[0][0]).toContain('c.json')
        expect(dbDriver.deleteFile.mock.calls[0][1]).toBe(false) // No revision recorded
      })
    })

    describe('revisions', async () => {
      it('empty when no revisions', async () => {})
      it('returns list of revisions when files modified', async () => {})
      it('revision with content works', async () => {})
    })
  })
})
