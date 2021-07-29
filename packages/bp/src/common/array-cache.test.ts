import _ from 'lodash'
import { ArrayCache } from './array-cache'

const RANDOM = () => Math.random().toString(36)

class TestObject {
  constructor(public someKey: string, public someOtherKey: string, public aNumber: number) {}

  static default(): TestObject {
    return new TestObject(RANDOM(), RANDOM(), Math.random())
  }

  setSomeKey(val: string) {
    this.someKey = val
  }
}

const getKeySpy = jest.fn()
const getKey = (val: TestObject) => {
  getKeySpy()
  return val.someKey
}
const renameValSpy = jest.fn()
const renameVal = (value: TestObject, prevKey: string, newKey: string) => {
  renameValSpy()
  value.setSomeKey(newKey)

  return value
}

const createObjects = (number: number) => {
  const objects: TestObject[] = []
  for (let i = 0; i < number; i++) {
    objects.push(TestObject.default())
  }

  return objects
}

const numberOfObjects = 10
const emptyArray = new Array()

let cache: ArrayCache<string, TestObject>
let objects: TestObject[]

describe('ArrayCache', () => {
  beforeEach(() => {
    cache = new ArrayCache(getKey, renameVal)
    objects = createObjects(numberOfObjects)

    jest.resetAllMocks()
  })

  describe('Initialize', () => {
    it('Set the inner array of the cache with the given values', () => {
      cache.initialize(_.cloneDeep(objects))

      const innerArray = cache['array']

      expect(innerArray.length).toEqual(numberOfObjects)
      expect(innerArray.length).toEqual(cache.values().length)
      expect(_.isEqual(innerArray, objects)).toEqual(true)
    })

    it('Sets an empty cache', () => {
      cache.initialize(emptyArray)

      const innerArray = cache['array']

      expect(innerArray.length).toEqual(0)
      expect(innerArray.length).toEqual(cache.values().length)
      expect(_.isEqual(innerArray, emptyArray)).toEqual(true)
    })

    it('Overrides the current cache values', () => {
      cache.initialize(objects)

      expect(cache.values().length).toEqual(numberOfObjects)

      cache.initialize(emptyArray)

      const innerArray = cache['array']

      expect(innerArray.length).toEqual(0)
      expect(innerArray.length).toEqual(cache.values().length)
      expect(_.isEqual(innerArray, emptyArray)).toEqual(true)
    })
  })

  describe('Values', () => {
    it('Returns the inner array of the cache', () => {
      cache.initialize(_.cloneDeep(objects))

      expect(cache.values().length).toEqual(numberOfObjects)
      expect(_.isEqual(cache.values(), objects)).toEqual(true)
    })

    it('Returns an empty cache', () => {
      cache.initialize(emptyArray)

      expect(cache.values().length).toEqual(0)
      expect(_.isEqual(cache.values(), emptyArray)).toEqual(true)
    })
  })

  describe('Reset', () => {
    it('Clear the cache', () => {
      cache.initialize(objects)
      cache.reset()

      const innerArray = cache['array']

      expect(innerArray.length).toEqual(0)
      expect(innerArray.length).toEqual(cache.values().length)
      expect(_.isEqual(innerArray, objects)).toEqual(false)
    })
  })

  describe('Get', () => {
    it('Returns the corresponding value', () => {
      cache.initialize(objects)

      const selectedObject = _.cloneDeep(objects[0])
      const returnedObject = cache.get(selectedObject.someKey)

      expect(getKeySpy).toHaveBeenCalled()
      expect(returnedObject).not.toBeUndefined()
      expect(_.isEqual(selectedObject, returnedObject)).toEqual(true)
    })

    it('Returns no value when the key does not exist in the cache', () => {
      cache.initialize(objects)

      const returnedObject = cache.get(RANDOM())

      expect(getKeySpy).toHaveBeenCalledTimes(numberOfObjects)
      expect(returnedObject).toBeUndefined()
    })
  })

  describe('Update', () => {
    it('Updates the value in the cache', () => {
      cache.initialize(objects)

      const selectedObject = _.cloneDeep(objects[0])
      selectedObject.aNumber = Math.random()
      selectedObject.someOtherKey = RANDOM()

      let returnedObject = cache.get(selectedObject.someKey)

      expect(returnedObject).not.toBeUndefined()
      expect(_.isEqual(selectedObject, returnedObject)).toEqual(false)

      cache.update(selectedObject.someKey, selectedObject)
      returnedObject = cache.get(selectedObject.someKey)

      expect(returnedObject).not.toBeUndefined()
      expect(_.isEqual(selectedObject, returnedObject)).toEqual(true)
    })

    it('Inserts the value when the key does not exist in the cache', () => {
      cache.initialize(objects)

      const newObject = createObjects(1)[0]
      let returnedObject = cache.get(newObject.someKey)
      expect(returnedObject).toBeUndefined()

      cache.update(newObject.someKey, newObject)

      returnedObject = cache.get(newObject.someKey)
      expect(returnedObject).not.toBeUndefined()
      expect(_.isEqual(newObject, returnedObject)).toEqual(true)
    })
  })

  describe('Rename', () => {
    it('Renames the key in the cache', () => {
      cache.initialize(objects)

      const selectedObject = _.cloneDeep(objects[0])
      const newKey = RANDOM()
      const oldKey = selectedObject.someKey

      cache.rename(selectedObject.someKey, newKey)
      const returnedObject = cache.get(newKey)
      const oldObject = cache.get(oldKey)

      expect(renameValSpy).toHaveBeenCalledTimes(1)
      expect(returnedObject).not.toBeUndefined()
      expect(oldObject).toBeUndefined()
      expect(getKey(returnedObject!)).toEqual(newKey)
    })

    it('Throws an error when the key does not exist in the cache', () => {
      cache.initialize(objects)

      const someKey = RANDOM()
      const returnedObject = cache.get(someKey)

      expect(renameValSpy).toHaveBeenCalledTimes(0)
      expect(returnedObject).toBeUndefined()
      expect(() => cache.rename(someKey, RANDOM())).toThrow()
    })
  })

  describe('Remove', () => {
    it('Removes the value from the cache', () => {
      cache.initialize(objects)

      const selectedObject = _.cloneDeep(objects[0])

      cache.remove(selectedObject.someKey)
      const returnedObject = cache.get(selectedObject.someKey)

      expect(returnedObject).toBeUndefined()
      expect(cache.values().length).toEqual(numberOfObjects - 1)
    })

    it('Throws an error when the key does not exist in the cache', () => {
      cache.initialize(objects)

      const someKey = RANDOM()
      const returnedObject = cache.get(someKey)

      expect(returnedObject).toBeUndefined()
      expect(() => cache.remove(someKey)).toThrow()
    })
  })

  describe('indexOf', () => {
    it('Returns the index of the key in the cache', () => {
      cache.initialize(objects)

      const index = 0
      const selectedObject = objects[index]

      const returnedIndex = cache['indexOf'](selectedObject.someKey)

      expect(index).toEqual(returnedIndex)
    })

    it('Returns a negative index if the key is not found in the cache', () => {
      cache.initialize(objects)

      const someKey = RANDOM()

      const returnedObject = cache.get(someKey)
      const returnedIndex = cache['indexOf'](someKey)

      expect(returnedObject).toBeUndefined()
      expect(returnedIndex).toBeLessThan(0)
    })
  })
})
