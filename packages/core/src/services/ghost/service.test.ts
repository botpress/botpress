import 'bluebird-global'
import { Logger } from 'botpress-module-sdk'
import 'reflect-metadata'

import { createSpyObject, MockObject } from '../../misc/utils'

import { ObjectCache } from '.'
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

  describe(`Disk Driver`, () => {
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

      diskDriver.listRevisionIds.mockReturnValue([])
      diskDriver.readFile.mockReturnValue(json)

      await ghost.global().readFileAsBuffer('test', 'a.json')
      await ghost.global().readFileAsObject<{ name: string }>('test', 'b.json')

      expect(cache.set).toHaveBeenCalledTimes(3) // because getObject calls getBuffer
      expect(cache.set.mock.calls[0][1]).toBe(json)
      expect(cache.set.mock.calls[1][1]).toBe(json)
      expect(cache.set.mock.calls[2][1]).toHaveProperty('name', 'test') // We cache an actual object
    })

    it('Never has any pending revisions', async () => {
      dbDriver.listRevisionIds.mockReturnValue(['abc']) // Even if DB driver says there are some revisions
      await ghost.global().upsertFile('test', 'a.json', 'Hello') // And that we modify a file

      const revisions = await ghost.global().getPending()
      expect(revisions).toMatchObject({})
    })
  })
})
