import _ from 'lodash'

import Database from 'core/database'
import { createDatabaseSuite } from 'core/database/index.tests'
import { asBytes, expectAsync } from 'core/misc/utils'

import { DBStorageDriver } from './db-driver'

createDatabaseSuite('GhostDB Driver', function(database: Database) {
  const driver = new DBStorageDriver(database)

  const F_A_NAME = 'a.txt'
  const F_A_PATH = `test/${F_A_NAME}`
  const F_A_CONTENT = 'content'

  describe('upsertFile', () => {
    it("creates if doesn't exist", async () => {
      await expectAsync(driver.readFile(F_A_PATH), m => m.toThrow(F_A_NAME))
      await driver.upsertFile(F_A_PATH, F_A_CONTENT)
      await expectAsync(driver.readFile(F_A_PATH), m => m.not.toThrow(F_A_NAME))
    })

    it('writing large blob', async () => {
      const size = asBytes('1mb')
      await driver.upsertFile(F_A_PATH, Buffer.alloc(size))
      const buffer = await driver.readFile(F_A_PATH)
      expect(buffer.length).toBe(size)
    })

    it('overwrite if exists', async () => {
      await driver.upsertFile(F_A_PATH, 'hello')
      const hello = await driver.readFile(F_A_PATH)
      expect(hello.toString()).toBe('hello')

      await driver.upsertFile(F_A_PATH, F_A_CONTENT)
      const overwrite = await driver.readFile(F_A_PATH)
      expect(overwrite.toString()).toBe(F_A_CONTENT)
    })

    it('records revisions OK', async () => {
      await driver.upsertFile(F_A_PATH, 'hello', true)
      const revisions1 = await driver.listRevisions('')

      await driver.upsertFile(F_A_PATH, 'hello2', true)
      const revisions2 = await driver.listRevisions('')

      expect(revisions2.length).toBeGreaterThan(revisions1.length)
    })

    it('records no revision when not asked', async () => {
      await driver.upsertFile(F_A_PATH, 'hello', false)
      const revisions1 = await driver.listRevisions('')

      await driver.deleteFile(F_A_PATH, false)
      const revisions2 = await driver.listRevisions('')

      expect(revisions1.length).toBe(0)
      expect(revisions2.length).toBe(0)
    })
  })

  describe('deleteFile', () => {
    it('deletion successful', async () => {
      await driver.upsertFile(F_A_PATH, F_A_CONTENT)
      await expectAsync(driver.readFile(F_A_PATH), m => m.not.toThrow(F_A_NAME))
      await driver.deleteFile(F_A_PATH)
      await expectAsync(driver.readFile(F_A_PATH), m => m.toThrow(F_A_NAME))
    })

    it('deletion of non-existent file', async () => {
      await driver.deleteFile(F_A_PATH)
    })

    it('mark revision', async () => {
      await driver.upsertFile(F_A_PATH, 'hello', false)
      const revisions1 = await driver.listRevisions('')
      await driver.deleteFile(F_A_PATH, true)
      const revisions2 = await driver.listRevisions('')
      expect(revisions1.length).toBe(0)
      expect(revisions2.length).toBe(1)
    })

    it('mark no revision', async () => {
      await driver.upsertFile(F_A_PATH, 'hello', false)
      const revisions1 = await driver.listRevisions('')
      await driver.deleteFile(F_A_PATH, false)
      const revisions2 = await driver.listRevisions('')
      expect(revisions1.length).toBe(0)
      expect(revisions2.length).toBe(0)
    })
  })

  describe('ls', () => {
    it('no folder = lists all files', async () => {
      await driver.upsertFile('/root1/a.txt', '...', false)
      await driver.upsertFile('/root1/b.txt', '...', false)
      await driver.upsertFile('/root2/c.txt', '...', false)
      await driver.upsertFile('/root2/d.txt', '...', false)
      await driver.deleteFile('/root2/d.txt', false)

      const files = await driver.directoryListing('/')
      expect(files).toContain('root1/a.txt')
      expect(files).toContain('root1/b.txt')
      expect(files).toContain('root2/c.txt')
      expect(files).not.toContain('root2/d.txt')
    })
    it('folder filter works', async () => {
      await driver.upsertFile('/root1/a.txt', '...', false)
      await driver.upsertFile('/root2/b.txt', '...', false)

      const files = await driver.directoryListing('/root1/')
      expect(files).toContain('a.txt')
      expect(files).not.toContain('b.txt')
    })
  })

  describe('listRevisions', () => {
    it('no revisions', async () => {
      const revisions = await driver.listRevisions('')
      expect(revisions).toHaveLength(0)
    })

    describe('with revisions', () => {
      it('with prefix', async () => {
        const now = new Date()
        await driver.upsertFile('/root1/a.txt', '...', true)
        await driver.upsertFile('/root1/b.txt', '...', true)
        await driver.upsertFile('/root2/c.txt', '...', true)
        const revisions = await driver.listRevisions('/root1')
        expect(revisions).toHaveLength(2)
        expect(revisions[0].path).toContain('root1')
        expect(revisions[0].revision).toHaveLength(8)
        expect(revisions[0].created_by).toBe('admin')
        expect(revisions[0].created_on).toBeDefined()
        expect(revisions[0].created_on.getTime()).toBeGreaterThanOrEqual(now.getTime())
      })

      it('no prefix', async () => {
        await driver.upsertFile('/root1/a.txt', '...', true)
        await driver.upsertFile('/root1/b.txt', '...', true)
        await driver.upsertFile('/root1/c.txt', '...', false)
        const revisions = await driver.listRevisions('')
        expect(revisions).toHaveLength(2)
      })
    })
  })

  describe('deleteRevisions', () => {
    it('no revisions', async () => {
      await driver.upsertFile('/root1/a.txt', '...', false)
      await expectAsync(driver.deleteRevision('/root1/a.txt', 'anything'), m => m.toBeDefined())
    })

    it('a lot of revisions', async () => {
      await driver.upsertFile('/root1/a.txt', '...', true)
      let revisions = await driver.listRevisions('')
      expect(revisions).toHaveLength(1)

      await driver.deleteRevision(revisions[0].path, revisions[0].revision)
      revisions = await driver.listRevisions('')
      expect(revisions).toHaveLength(0)
    })
  })
})
