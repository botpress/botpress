import _ from 'lodash'
import storage from './storage'

const KEY = 'akey'
const VALUE = { a: 'dict', with: 'some', values: [1, 2, 3, 4, 5] }
const VALUES = [8, 1.2, 'a simple string value', VALUE, [1, 2, 3]]
const NULL_VALUES = [null, undefined]
let CIRCULAR_OBJ = {}
CIRCULAR_OBJ['CIRCULAR_OBJ'] = CIRCULAR_OBJ

const cases: (string | boolean | null)[][] = [
  ['sessionStorage', true],
  ['localStorage', false],
  ['cookie', null]
]

jest.useFakeTimers()
describe('Storage', () => {
  afterEach(done => {
    storage.del(KEY)
    window.USE_SESSION_STORAGE = false

    jest.runAllTimers()

    done()
  })

  describe('Get', () => {
    describe.each(cases)('[%s]', (_, useSessionStorage) => {
      beforeAll(() => {
        if (useSessionStorage === null) {
          jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
            throw new Error()
          })
        }
      })

      beforeEach(() => {
        if (useSessionStorage !== null) {
          window.USE_SESSION_STORAGE = useSessionStorage as boolean
        }
      })

      it('Returns undefined if the value does not exists', () => {
        const undefinedValue = storage.get(KEY)

        expect(undefinedValue).toBeUndefined()
      })

      it('Returns the value parsed if it exists', () => {
        storage.set(KEY, VALUE)

        const result = storage.get<typeof VALUE>(KEY)

        expect(result).toEqual(VALUE)
      })

      it('Returns all kind of stored values', () => {
        for (const val of VALUES) {
          storage.set(KEY, val)

          const result = storage.get<typeof val>(KEY)

          expect(result).toEqual(val)
        }
      })
    })
  })

  describe('Set', () => {
    describe.each(cases)('[%s]', (_, useSessionStorage) => {
      beforeEach(() => {
        window.USE_SESSION_STORAGE = useSessionStorage as boolean
      })

      it("Does not store the value if it's undefined or null", () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

        for (const val of NULL_VALUES) {
          storage.set(KEY, val)

          const result = storage.get<typeof val>(KEY)

          expect(result).toBeUndefined()
          expect(spy).toHaveBeenCalledTimes(1)
          expect(spy).toHaveBeenCalledWith(
            'Error while setting data into storage.',
            '[Storage] Cannot store null or undefined values'
          )

          spy.mockClear()
        }
      })

      it('Stores all kind of values', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

        for (const val of VALUES) {
          storage.set(KEY, val)

          const result = storage.get<typeof val>(KEY)

          expect(result).toEqual(val)
          expect(spy).not.toHaveBeenCalled()

          spy.mockClear()
        }
      })

      it('Displays an error when trying to set an invalid object', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

        storage.set(KEY, CIRCULAR_OBJ)

        const result = storage.get(KEY)

        expect(result).toEqual('')
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('[Storage] Error parsing value', CIRCULAR_OBJ)
      })
    })
  })

  describe('Del', () => {
    describe.each(cases)('[%s]', (_, useSessionStorage) => {
      beforeEach(() => {
        window.USE_SESSION_STORAGE = useSessionStorage as boolean
      })

      it('Removes the value from its storage', () => {
        storage.set(KEY, VALUE)

        let result = storage.get<typeof VALUE>(KEY)
        expect(result).toEqual(VALUE)

        storage.del(KEY)

        result = storage.get<typeof VALUE>(KEY)
        expect(result).toBeUndefined()
      })

      it('Does nothing if the key does not exist', () => {
        let result = storage.get<typeof VALUE>(KEY)
        expect(result).toBeUndefined()

        storage.del(KEY)

        result = storage.get<typeof VALUE>(KEY)
        expect(result).toBeUndefined()
      })
    })
  })
})
