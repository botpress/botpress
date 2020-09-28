import extractVariables from './extractVariables'

test('variables extraction', () => {
  expect(extractVariables('give me a $fruit')[0]).toBe('fruit')

  expect(extractVariables('give me a $fruit ')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit.')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit?')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit!')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit,')[0]).toBe('fruit')
  expect(extractVariables("give me a $fruit'")[0]).toBe('fruit')
  expect(extractVariables('give me a "$fruit"')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit~')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit\\')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit/')[0]).toBe('fruit')

  expect(extractVariables('give me a $fruit right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit.right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit?right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit!right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit,right now')[0]).toBe('fruit')
  expect(extractVariables("give me a $fruit'right now")[0]).toBe('fruit')
  expect(extractVariables('give me a "$fruit"right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit~right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit\\right now')[0]).toBe('fruit')
  expect(extractVariables('give me a $fruit/right now')[0]).toBe('fruit')

  let fruits = extractVariables('give me a $fruit, a $fruit, a $fruit and a $fruit')
  expect(fruits.length).toBe(4)
  expect(fruits[0]).toBe('fruit')
  expect(fruits[1]).toBe('fruit')
  expect(fruits[2]).toBe('fruit')
  expect(fruits[3]).toBe('fruit')

  const points = extractVariables('fly from point $A to $B')
  expect(points.length).toBe(2)
  expect(points[0]).toBe('A')
  expect(points[1]).toBe('B')

  fruits = extractVariables('a $fruit is $5') // variable name can't start with a number
  expect(fruits.length).toBe(1)
  expect(fruits[0]).toBe('fruit')

  fruits = extractVariables('a $fruit is 5$')
  expect(fruits.length).toBe(1)
  expect(fruits[0]).toBe('fruit')

  fruits = extractVariables('a $fruit is 5 $')
  expect(fruits.length).toBe(1)
  expect(fruits[0]).toBe('fruit')

  fruits = extractVariables('$')
  expect(fruits.length).toBe(0)

  let cities = extractVariables('fly from $city1 to $city2')
  expect(cities.length).toBe(2)
  expect(cities[0]).toBe('city1')
  expect(cities[1]).toBe('city2')

  cities = extractVariables('fly from $city_1 to $city-2') // allow _ and -
  expect(cities.length).toBe(2)
  expect(cities[0]).toBe('city_1')
  expect(cities[1]).toBe('city-2')

  cities = extractVariables('fly from $سity to $木ity-2') // variable extraction doesnt work for non-latin words...
  expect(cities.length).toBe(0)

  cities = extractVariables('fly from $cسity to $c木ity-2') // variable extraction doesnt work for non-latin words...
  expect(cities.length).toBe(2)
  expect(cities[0]).toBe('c') // weird but this is expected
  expect(cities[1]).toBe('c')
})
