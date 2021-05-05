import 'bluebird-global'
import { ObjectCache } from 'common/object-cache'
import 'reflect-metadata'
import { PersistedConsoleLogger } from 'core/logger'
import { createSpyObject, MockObject } from 'core/misc/utils'

import { FileRevision } from '.'
import { DBStorageDriver } from './drivers/db-driver'
import { DiskStorageDriver } from './drivers/disk-driver'
import { GhostService } from './ghost-service'

const BOT_ID = 'bot123'

describe('Ghost Service', () => {
  let ghost: GhostService // eslint-disable-line
  let diskDriver: MockObject<DiskStorageDriver>,
    dbDriver: MockObject<DBStorageDriver>,
    cache: MockObject<ObjectCache>,
    logger: MockObject<PersistedConsoleLogger>

  beforeEach(() => {
    diskDriver = createSpyObject<DiskStorageDriver>()
    dbDriver = createSpyObject<DBStorageDriver>()
    cache = createSpyObject<ObjectCache>()
    logger = createSpyObject<PersistedConsoleLogger>()
    logger.attachError.mockReturnValue(logger)
    ghost = new GhostService(diskDriver.T, dbDriver.T, cache.T, logger.T)
  })

  describe('Using Disk Driver', () => {
    beforeEach(async () => {
      await ghost.initialize(false, true)
    })

    it('DB Driver is never ever called', async () => {
      await ghost.global().deleteFile('', '')
      await ghost.global().directoryListing('', '')
      await ghost.global().getPendingChanges()
      await ghost.global().isFullySynced()
      await ghost.global().readFileAsBuffer('', '')
      await ghost.global().sync()
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
        .mockReturnValueOnce(Buffer.from(''))
        .mockReturnValueOnce('{ "name": "test" }')
        .mockReturnValueOnce('Hello')

      const res1 = await ghost.global().readFileAsBuffer('test', 'a.json')
      const res2 = await ghost.global().readFileAsObject<{ name: string }>('test', 'a.json')
      const res3 = await ghost.global().readFileAsString('test', 'a.json')

      expect(res1).toBeInstanceOf(Buffer)
      expect(res2).toHaveProperty('name', 'test')
      expect(res3).toBe('Hello')
    })

    it('Reads file from cache if cached', async () => {
      const json = '{ "name": "test" }'
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
      const json = '{ "name": "test" }'
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
      diskDriver.readFile.mockImplementation(fileName => {
        return fileName === `data/bots/${BOT_ID}/bot.config.json` && '{}'
      })
      await ghost.forBot(BOT_ID).upsertFile('test', 'a.json', 'Hello') // And that we modify a file

      const revisions = await ghost.global().getPendingChanges()
      expect(revisions).toMatchObject({})
    })
  })

  describe('Using DB Driver', () => {
    const buildRev = n =>
      <FileRevision>{
        path: 'file',
        revision: n
      }

    beforeEach(async () => {
      await ghost.initialize(true, true)
    })

    describe('read/write/delete', () => {
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

    describe('directory listing', () => {
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

    describe('sync', () => {
      it('if disk is up to date, sync disk files', async () => {
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

        await ghost.global().sync()

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

    describe('revisions', () => {
      it('empty when no revisions', async () => {
        dbDriver.listRevisions.mockReturnValue([])
        const pending = await ghost.global().getPendingChanges()
        expect(Object.keys(pending)).toHaveLength(0)
      })
      it('returns grouped list of revisions when files modified', async () => {
        const r1 = { path: './data/global/a/1.txt', revision: 'r1' }
        const r2 = { path: './data/global/a/2.txt', revision: 'r2' }
        const r3 = { path: './data/global/b/3.txt', revision: 'r3' }

        dbDriver.listRevisions.mockReturnValue([r1, r2, r3])
        const pending = await ghost.global().getPendingChanges()

        expect(Object.keys(pending)).toHaveLength(2)
        expect(pending['a']).toHaveLength(2)
        expect(pending['b']).toHaveLength(1)

        expect(pending['a'][0].path).toContain('1.txt')
        expect(pending['a'][0].revision).toContain('r1')
      })
    })
  })
})
