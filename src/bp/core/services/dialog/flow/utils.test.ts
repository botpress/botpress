import { TreeSearch } from './utils'

const PATH_SEPARATOR = '/'
const KEY_SEPARATOR = '-'
const KEYS = ['a key', 'a second one', 'and a third one']
const PATHS = ['abc', 'abc/def', 'xyz', 'abc/def/ghi', 'abc/def/abc/def']
const RANDOM = () => Math.random().toString(36)

let randomKey = RANDOM()
let randomValue = RANDOM()

describe('TreeSearch', () => {
  beforeEach(() => {
    randomKey = RANDOM()
    randomValue = RANDOM()
  })

  describe('Insert', () => {
    it('Inserts properly the value into the tree structure so it can be accessed quickly', () => {
      const tree = new TreeSearch(KEY_SEPARATOR)

      tree.insert(randomKey, randomValue)

      const children = tree['root'].children

      expect(tree.count).toBe(1)
      expect(children.size).toBe(1)
      expect(children.get(randomKey)!.value).toBe(randomValue)
    })

    it('Inserts all the keys into the tree structure', () => {
      const tree = new TreeSearch(KEY_SEPARATOR)

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      const children = tree['root'].children

      expect(children.size).toBe(KEYS.length)
      expect(tree.count).toBe(KEYS.length)
      for (const key of KEYS) {
        expect(children.get(key)!.value).toBe(key)
      }
    })

    it('Inserts all the paths into the tree structure', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (const path of PATHS) {
        tree.insert(path, path)
      }

      expect(tree.count).toBe(PATHS.length)
      for (const path of PATHS) {
        expect(tree.get(path)!).toBe(path)
      }
    })

    it('Overrides the value if override is set to true', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)
      const otherRandomValue = RANDOM()

      tree.insert(randomKey, randomValue)
      tree.insert(randomKey, otherRandomValue, true)

      expect(tree.get(randomKey)!).toBe(otherRandomValue)
      expect(tree.count).toBe(1)
    })

    it('Does not override the value if override is set to false', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)
      const otherRandomValue = RANDOM()

      tree.insert(randomKey, randomValue)
      tree.insert(randomKey, otherRandomValue, false)

      expect(tree.get(randomKey)!).toBe(randomValue)
      expect(tree.count).toBe(1)
    })

    it('Does not insert duplicate keys', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (let i = 0; i < 10; i++) {
        tree.insert(randomKey, randomValue)
      }

      expect(tree.count).toBe(1)
    })

    it('Does nothing if the key is empty', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      tree.insert('', randomValue)

      expect(tree.count).toBe(0)
    })
  })

  describe('Get', () => {
    it('Returns the proper value from the tree structure', () => {
      const tree = new TreeSearch(KEY_SEPARATOR)

      tree.insert(randomKey, randomValue)

      expect(tree.get(randomKey)!).toBe(randomValue)
    })

    it('Returns undefined where the is not result for the search', () => {
      const tree = new TreeSearch(KEY_SEPARATOR)

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      expect(tree.count).toBe(KEYS.length)
      expect(tree.get(randomKey)!).toBeUndefined
    })

    it('Returns undefined if the key is empty', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      tree.insert(randomKey, randomValue)

      expect(tree.count).toBe(1)
      expect(tree.get('')!).toBeUndefined()
    })
  })

  describe('Count', () => {
    it('Returns the number of inserted values', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (let i = 0; i < 10; i++) {
        tree.insert(randomKey, randomValue)
      }

      expect(tree.count).toBe(1)
    })

    it('Returns the number unique values inserted', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)
      const iterations = 10

      for (let i = 0; i < iterations; i++) {
        tree.insert(RANDOM(), RANDOM())
      }

      expect(tree.count).toBe(iterations)
    })
  })
})
