import levenshtein from './levenshtein'

const reverse = (s: string) =>
  s
    .split('')
    .reverse()
    .join('')

test('levenshtein distance is never negative', () => {
  // arrange
  const a = 'abcd'
  const b = 'abcdefghij'

  // act
  const dist = levenshtein(a, b)

  // assert
  expect(dist).toBeGreaterThanOrEqual(0)
})

test('levenshtein distance is the expected one', () => {
  // arrange
  const a = 'abzdefghj'
  const b = 'abcdefghij'

  // act
  const dist = levenshtein(a, b)

  // assert
  const expected = (10 - 2) / 10
  expect(dist).toBe(expected)
})

test('levenshtein distance is commutative', () => {
  // arrange
  const a = 'abzdefghj'
  const b = 'abcdefghij'

  // act
  const dist_ab = levenshtein(a, b)
  const dist_ba = levenshtein(b, a)

  // assert
  expect(dist_ab).toBe(dist_ba)
})

test('levenshtein distance is same for upside-down strings', () => {
  // arrange
  const a = 'abzdefghj'
  const b = 'abcdefghij'

  // act
  const dist = levenshtein(b, a)
  const reversed_dist = levenshtein(reverse(a), reverse(b))

  // assert
  expect(dist).toBe(reversed_dist)
})

test('levenshtein distance works for non latin characters', () => {
  // arrange
  // const wholeArabic = 'ي	و	ه	ن	م	ل	ك	ق	ف	غ	ع	ظ	ط	ض	ص	ش	س	ز	ر	ذ	د	خ	ح	ج	ث	ت	ب	ا'
  const a = 'ر	د	خ	ح	ج	ث	ي	ب	ا'.split('\t').join('')
  const b = 'ر	ذ	د	خ	ح	ج	ث	ت	ب	ا'.split('\t').join('')

  // act
  const dist = levenshtein(a, b)

  // assert
  const expected = (10 - 2) / 10
  expect(dist).toBe(expected)
})

test('levenshtein distance works for non latin upside-down strings', () => {
  // arrange
  const a = 'ر	د	خ	ح	ج	ث	ي	ب	ا'.split('\t').join('')
  const b = 'ر	ذ	د	خ	ح	ج	ث	ت	ب	ا'.split('\t').join('')

  // act
  const dist = levenshtein(b, a)
  const reversed_dist = levenshtein(reverse(a), reverse(b))

  // assert
  expect(dist).toBe(reversed_dist)
})
