import { test, assert } from 'vitest'
import { isIssueTitleFormatValid } from './issue-title-format-validator'

test('assert that a title containing only words is valid', async () => {
  const title = 'any string'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with square brackets not on the first or second word is valid', async () => {
  const title = 'any string [abc]'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one opening square bracket on the first word is valid', async () => {
  const title = '[abc'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one closing square bracket on the first word is valid', async () => {
  const title = 'abc]'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with and one opening square bracket on the second word is valid', async () => {
  const title = 'abc[def'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one closing square bracket on the second word is valid', async () => {
  const title = 'abc def]'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with parenthesiss not on the first or second word is valid', async () => {
  const title = 'any string (abc)'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one opening parenthesis on the first word is valid', async () => {
  const title = '(abc'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one closing parenthesis on the first word is valid', async () => {
  const title = 'abc)'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one opening parenthesis on the second word is valid', async () => {
  const title = 'abc(def'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one closing parenthesis on the second word is valid', async () => {
  const title = 'abc def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with one closing parenthesis on the second word is valid', async () => {
  const title = 'abc def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isTrue(actual)
})

test('assert that a title with square brackets on the first word is invalid', async () => {
  const title = '[abc] def'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with square brackets on the second word is invalid', async () => {
  const title = 'abc [def]'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with square brackets on the second word with no space between the first and second word is invalid', async () => {
  const title = 'abc[def]'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with square brackets on the second word with multiple spaces between the first and second word is invalid', async () => {
  const title = 'abc    [def]'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with square brackets on the second word with multiple spaces between the first and second word is invalid', async () => {
  const title = 'abc    [def]'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with square brackets on the first and second words is invalid', async () => {
  const title = '[abc def]'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with parenthesis on the first word is invalid', async () => {
  const title = '(abc) def'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with parenthesis on the second word is invalid', async () => {
  const title = 'abc (def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with parenthesis on the second word with no space between the first and second word is invalid', async () => {
  const title = 'abc(def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with parenthesis on the second word with multiple spaces between the first and second word is invalid', async () => {
  const title = 'abc    (def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with parenthesis on the second word with multiple spaces between the first and second word is invalid', async () => {
  const title = 'abc    (def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})

test('assert that a title with parenthesis on the first and second words is invalid', async () => {
  const title = '(abc def)'

  const actual = isIssueTitleFormatValid(title)

  assert.isFalse(actual)
})
