import { test, expect } from 'vitest'
import * as caseUtils from './case-utils'

const pascalCase = 'HelloLittleWorld'
const kebabCase = 'hello-little-world'
const snakeCase = 'hello_little_world'
const screamingSnakeCase = 'HELLO_LITTLE_WORLD'
const camelCase = 'helloLittleWorld'

test('case utils should convert from pascal case to all other cases', () => {
  expect(caseUtils.to.kebabCase(pascalCase)).toBe(kebabCase)
  expect(caseUtils.to.snakeCase(pascalCase)).toBe(snakeCase)
  expect(caseUtils.to.screamingSnakeCase(pascalCase)).toBe(screamingSnakeCase)
  expect(caseUtils.to.camelCase(pascalCase)).toBe(camelCase)
})

test('case utils should convert from kebab case to all other cases', () => {
  expect(caseUtils.to.pascalCase(kebabCase)).toBe(pascalCase)
  expect(caseUtils.to.snakeCase(kebabCase)).toBe(snakeCase)
  expect(caseUtils.to.screamingSnakeCase(kebabCase)).toBe(screamingSnakeCase)
  expect(caseUtils.to.camelCase(kebabCase)).toBe(camelCase)
})

test('case utils should convert from snake case to all other cases', () => {
  expect(caseUtils.to.pascalCase(snakeCase)).toBe(pascalCase)
  expect(caseUtils.to.kebabCase(snakeCase)).toBe(kebabCase)
  expect(caseUtils.to.screamingSnakeCase(snakeCase)).toBe(screamingSnakeCase)
  expect(caseUtils.to.camelCase(snakeCase)).toBe(camelCase)
})

test('case utils should convert from screaming snake case to all other cases', () => {
  expect(caseUtils.to.pascalCase(screamingSnakeCase)).toBe(pascalCase)
  expect(caseUtils.to.kebabCase(screamingSnakeCase)).toBe(kebabCase)
  expect(caseUtils.to.snakeCase(screamingSnakeCase)).toBe(snakeCase)
  expect(caseUtils.to.camelCase(screamingSnakeCase)).toBe(camelCase)
})

test('case utils should convert from camel case to all other cases', () => {
  expect(caseUtils.to.pascalCase(camelCase)).toBe(pascalCase)
  expect(caseUtils.to.kebabCase(camelCase)).toBe(kebabCase)
  expect(caseUtils.to.snakeCase(camelCase)).toBe(snakeCase)
  expect(caseUtils.to.screamingSnakeCase(camelCase)).toBe(screamingSnakeCase)
})

test('case utils should split special characters when converting', () => {
  expect(caseUtils.to.pascalCase(`${pascalCase}.2`)).toBe(`${pascalCase}2`)
  expect(caseUtils.to.kebabCase(`${kebabCase}.2`)).toBe(`${kebabCase}-2`)
  expect(caseUtils.to.snakeCase(`${snakeCase}.2`)).toBe(`${snakeCase}_2`)
  expect(caseUtils.to.screamingSnakeCase(`${screamingSnakeCase}.2`)).toBe(`${screamingSnakeCase}_2`)
  expect(caseUtils.to.camelCase(`${camelCase}.2`)).toBe(`${camelCase}2`)
})

test('case utils should prevent special characters when checking', () => {
  expect(caseUtils.is.pascalCase(`${pascalCase}.2`)).toBe(false)
  expect(caseUtils.is.kebabCase(`${kebabCase}.2`)).toBe(false)
  expect(caseUtils.is.snakeCase(`${snakeCase}.2`)).toBe(false)
  expect(caseUtils.is.screamingSnakeCase(`${screamingSnakeCase}.2`)).toBe(false)
  expect(caseUtils.is.camelCase(`${camelCase}.2`)).toBe(false)
})
