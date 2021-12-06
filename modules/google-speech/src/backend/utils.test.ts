import { closest } from './utils'

const randomNumber = (max = 100) => {
  const value = Math.floor(Math.random() * max)
  // Prevents returning 0 because it makes tests fail randomly
  return value > 1 ? value : randomNumber(max)
}

const arrayGenerator = (size = 10): number[] => {
  return Array.from({ length: size }, () => randomNumber())
}
const dumbSearch = (array: number[], value: number) => {
  const distance = new Array(array.length).fill(0)
  for (let i = 0; i < array.length; i++) {
    distance[i] = Math.abs(array[i] - value)
  }

  let smallestDistance = Number.MAX_VALUE
  let result: number = 0
  for (let i = 0; i < distance.length; i++) {
    if (distance[i] < smallestDistance) {
      smallestDistance = distance[i]
      result = array[i]
    } else if (distance[i] === smallestDistance) {
      smallestDistance = distance[i]
      result = result > array[i] ? result : array[i]
    }
  }

  return result
}

describe('Number', () => {
  let array: number[]

  beforeEach(() => {
    array = arrayGenerator(randomNumber())
  })

  describe('Closest', () => {
    it('Find the closest number inside an array of numbers', () => {
      for (let i = 0; i < 100; i++) {
        const value: number = randomNumber()
        const resClosest: number = closest(array, value)
        const resDumbSearch: number = dumbSearch(array, value)

        expect(typeof resClosest).toEqual('number')
        expect(resClosest).toEqual(resDumbSearch)
      }
    })
  })
})
