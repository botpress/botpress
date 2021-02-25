import _ from 'lodash'
import { TreeSearch, PATH_SEPARATOR, SPACE_SEPARATOR } from './treeSearch'

const OBJECT_VALUE = { key: 'value', nested: { key: '1', value: 1 } }
const EMPTY_KEY = ''
const KEYS = ['a key', 'a second one', 'and a third one']
const INVALID_KEY = 'a key invalid'
const PATHS = ['abc', 'abc/def', 'xyz', 'abc/def/ghi', 'abc/def/abc/def'] as const
const PATHS_PARENTS: { [path in typeof PATHS[number]]: typeof PATHS[number] | undefined } = {
  abc: undefined,
  'abc/def': 'abc',
  xyz: undefined,
  'abc/def/ghi': 'abc/def',
  'abc/def/abc/def': 'abc/def'
}
// A path that will do a complete tree traversal
const OVERFLOW_PATH = 'abc/def/abc/def/ghi'
const RANDOM = () => Math.random().toString(36)

let randomKey = RANDOM()
let randomValue = RANDOM()

describe('TreeSearch', () => {
  beforeEach(() => {
    randomKey = RANDOM()
    randomValue = RANDOM()
  })

  describe('Insert', () => {
    it('Inserts the value into the tree structure so it can be accessed by key', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      const children = tree['root'].children

      expect(tree.count).toEqual(1)
      expect(children.size).toEqual(tree.count)
      expect(children.get(randomKey)!.value).toEqual(randomValue)
    })

    it('Inserts all the keys into the tree structure', () => {
      const tree = new TreeSearch()

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      const children = tree['root'].children

      expect(children.size).toEqual(KEYS.length)
      expect(tree.count).toEqual(KEYS.length)
      for (const key of KEYS) {
        expect(children.get(key)!.value).toEqual(key)
      }
    })

    it('Inserts all the paths into the tree structure', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (const [i, path] of PATHS.entries()) {
        tree.insert(path, path)
      }

      expect(tree.count).toEqual(PATHS.length)
      for (const path of PATHS) {
        expect(tree.get(path)!).toEqual(path)
      }
    })

    it('Overrides the inserted value if override is set to true', () => {
      const tree = new TreeSearch()
      const otherRandomValue = RANDOM()

      tree.insert(randomKey, randomValue)
      tree.insert(randomKey, otherRandomValue, true)

      expect(tree.get(randomKey)!).toEqual(otherRandomValue)
      expect(tree.count).toEqual(1)
    })

    it('Does not override the value if override is set to false', () => {
      const tree = new TreeSearch()
      const otherRandomValue = RANDOM()

      tree.insert(randomKey, randomValue)
      tree.insert(randomKey, otherRandomValue, false)

      expect(tree.get(randomKey)!).toEqual(randomValue)
      expect(tree.count).toEqual(1)
    })

    it('Does not insert duplicate keys', () => {
      const tree = new TreeSearch()

      for (let i = 0; i < 10; i++) {
        tree.insert(randomKey, randomValue)
      }

      expect(tree.count).toEqual(1)
    })

    it('Does nothing if the key is empty', () => {
      const tree = new TreeSearch()

      tree.insert(EMPTY_KEY, randomValue)

      expect(tree.count).toEqual(0)
    })

    it('Inserts values only into the first level when no separator is provided', () => {
      const tree = new TreeSearch()

      for (const path of PATHS) {
        tree.insert(path, path)
      }

      const children = tree['root'].children

      expect(children.size).toEqual(PATHS.length)
      expect(tree.count).toEqual(PATHS.length)
    })
  })

  describe('Get', () => {
    it('Returns undefined if the tree is empty', () => {
      const tree = new TreeSearch()

      const children = tree['root'].children

      expect(tree.count).toEqual(0)
      expect(children.size).toEqual(0)
      expect(tree.get(randomKey)!).toBeUndefined()
    })

    it('Returns the proper value from the tree structure (single item)', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      const children = tree['root'].children

      expect(children.get(randomKey)!.value).toEqual(randomValue)
      expect(tree.get(randomKey)!).toEqual(randomValue)
    })

    it('Returns undefined when there is no result for the search', () => {
      const tree = new TreeSearch(SPACE_SEPARATOR)

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      expect(tree.count).toEqual(KEYS.length)
      expect(tree.get(randomKey)!).toBeUndefined()
    })

    it('Returns undefined if the key is empty', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      expect(tree.count).toEqual(1)
      expect(tree.get(EMPTY_KEY)!).toBeUndefined()
      expect(tree.get(null as any)!).toBeUndefined()
      expect(tree.get(undefined as any)!).toBeUndefined()
    })

    it('Returns all the proper values from the tree (one level deep)', () => {
      const tree = new TreeSearch()

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      const children = tree['root'].children

      // makes sure all items are at the same level
      expect(children.size).toEqual(KEYS.length)
      expect(tree.count).toEqual(KEYS.length)
      expect(tree.get(randomKey)!).toBeUndefined()
      for (const key of KEYS) {
        expect(tree.get(key)).toEqual(key)
      }
    })

    it('Returns all the proper values from the tree (few levels deep)', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (const path of PATHS) {
        tree.insert(path, path)
      }

      const children = tree['root'].children

      // makes sure there is items on different levels
      expect(children.size).not.toEqual(PATHS.length)
      expect(tree.count).toEqual(PATHS.length)
      expect(tree.get(randomKey)!).toBeUndefined()
      for (const path of PATHS) {
        expect(tree.get(path)).toEqual(path)
      }
    })

    it('Returns the proper object value from the tree (one level deep)', () => {
      const tree = new TreeSearch<typeof OBJECT_VALUE>()

      tree.insert(randomKey, OBJECT_VALUE)

      const children = tree['root'].children

      expect(children.get(randomKey)!.value).toEqual(OBJECT_VALUE)
      expect(tree.get(randomKey)!).toEqual(OBJECT_VALUE)
    })

    it('Returns the proper object values from the tree (few levels deep)', () => {
      const tree = new TreeSearch<typeof OBJECT_VALUE>(PATH_SEPARATOR)
      const objectValues: Array<typeof OBJECT_VALUE> = []

      for (const [i, path] of PATHS.entries()) {
        const obj = _.cloneDeep(OBJECT_VALUE)
        obj.nested.key = path

        tree.insert(path, objectValues[i])

        expect(tree.get(path)).toEqual(objectValues[i])
      }
    })
  })

  describe('GetParent', () => {
    it('Returns undefined if the tree is empty', () => {
      const tree = new TreeSearch()

      const children = tree['root'].children

      expect(tree.count).toEqual(0)
      expect(children.size).toEqual(0)
      expect(tree.getParent(randomKey)!).toBeUndefined()
    })

    it('Returns undefined if the key has no parent', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      const children = tree['root'].children

      expect(children.get(randomKey)!.value).toEqual(randomValue)
      expect(tree.getParent(randomKey)!).toBeUndefined()
    })

    it('Returns undefined when there is no result for the search (few levels deep)', () => {
      const tree = new TreeSearch(SPACE_SEPARATOR)

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      const children = tree['root'].children

      // makes sure there is items on different levels
      expect(children.size).not.toEqual(PATHS.length)
      expect(tree.count).toEqual(KEYS.length)
      expect(tree.getParent(INVALID_KEY)!).toBeUndefined()
    })

    it('Returns undefined when there is no result for the search (complete tree traversal)', () => {
      const tree = new TreeSearch(SPACE_SEPARATOR)

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      const children = tree['root'].children

      // makes sure there is items on different levels
      expect(children.size).not.toEqual(PATHS.length)
      expect(tree.count).toEqual(KEYS.length)
      expect(tree.getParent(OVERFLOW_PATH)!).toBeUndefined()
    })

    it('Returns undefined if the key is empty', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      expect(tree.count).toEqual(1)
      expect(tree.getParent(EMPTY_KEY)!).toBeUndefined()
      expect(tree.getParent(null as any)!).toBeUndefined()
      expect(tree.getParent(undefined as any)!).toBeUndefined()
    })

    it('Returns undefined for all keys (one level deep)', () => {
      const tree = new TreeSearch()

      for (const key of KEYS) {
        tree.insert(key, key)
      }

      const children = tree['root'].children

      // makes sure all items are at the same level
      expect(children.size).toEqual(KEYS.length)
      expect(tree.count).toEqual(KEYS.length)
      expect(tree.getParent(randomKey)!).toBeUndefined()
      for (const key of KEYS) {
        expect(tree.getParent(key)).toBeUndefined()
      }
    })

    it('Returns all the proper parent values from the tree (few levels deep)', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (const path of PATHS) {
        tree.insert(path, path)
      }

      const children = tree['root'].children

      // makes sure there is items on different levels
      expect(children.size).not.toEqual(PATHS.length)
      expect(tree.count).toEqual(PATHS.length)
      expect(tree.getParent(randomKey)!).toBeUndefined()
      for (const path of PATHS) {
        expect(tree.getParent(path)).toEqual(PATHS_PARENTS[path])
      }
    })
  })

  describe('Remove', () => {
    it('Removes all the inserted values from the tree', () => {
      const tree = new TreeSearch(PATH_SEPARATOR)

      for (const path of PATHS) {
        tree.insert(path, path)
      }
      expect(tree.count).toEqual(PATHS.length)

      for (const [i, path] of PATHS.entries()) {
        expect(tree.get(path)).toEqual(path)
        tree.remove(path)
        expect(tree.get(path)).toBeUndefined()
      }
      expect(tree.count).toEqual(0)
    })

    it('Does not remove the value if the key is not present in the tree', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      tree.remove(PATHS[0])
      expect(tree.get(randomKey)).toEqual(randomValue)
    })

    it('Does nothing if the key is empty', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      tree.remove(EMPTY_KEY)
      expect(tree.get(randomKey)).toEqual(randomValue)
    })

    it('Does nothing if the tree is empty', () => {
      const tree = new TreeSearch()

      expect(tree.count).toEqual(0)
      tree.remove(randomKey)
      expect(tree.count).toEqual(0)
      expect(tree.get(randomKey)).toBeUndefined()
    })
  })

  describe('Count', () => {
    it('Returns the number of inserted values', () => {
      const tree = new TreeSearch()

      tree.insert(randomKey, randomValue)

      expect(tree.count).toEqual(1)
    })

    it('Returns the number unique values inserted', () => {
      const tree = new TreeSearch()
      const iterations = 10

      for (let i = 0; i < iterations; i++) {
        tree.insert(RANDOM(), RANDOM())
      }

      expect(tree.count).toEqual(iterations)
    })
  })
})
