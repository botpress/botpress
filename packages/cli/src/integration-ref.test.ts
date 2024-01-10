import { describe } from 'node:test'
import { test, expect } from 'vitest'
import { formatIntegrationRef, IntegrationRef, parseIntegrationRef } from './integration-ref'

const path = '/my/path'
const prefixedUlid = 'intver_01HF58RDKE3M7K5RJ5XZ7GF6HE'
const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const name = 'myintegration'

describe('parseIntegrationRef', () => {
  test('parse empty string should return undefined', () => {
    // arrange
    const ref = ''
    // act
    const result = parseIntegrationRef(ref)
    // assert
    expect(result).toBeUndefined()
  })

  test('parse with invalid version should return undefined', () => {
    // arrange
    const ref0 = `${name}@lol`
    const ref1 = `${name}@1`
    const ref2 = `${name}@1.0`
    // act
    const result0 = parseIntegrationRef(ref0)
    const result1 = parseIntegrationRef(ref1)
    const result2 = parseIntegrationRef(ref2)
    // assert
    expect(result0).toBeUndefined()
    expect(result1).toBeUndefined()
    expect(result2).toBeUndefined()
  })

  test('parse with an absolute path should return path', () => {
    // arrange
    const ref = path
    // act
    const result = parseIntegrationRef(ref)
    // assert
    const expected: IntegrationRef = { type: 'path', path: ref }
    expect(result).toEqual(expected)
  })

  test('parse with a prefixed ULID sets `id` type', () => {
    // arrange
    const ref = prefixedUlid
    // act
    const result = parseIntegrationRef(ref)
    // assert
    const expected: IntegrationRef = { type: 'id', id: ref }
    expect(result).toEqual(expected)
  })

  test('parse with a legacy UUID sets `id` type', () => {
    // arrange
    const ref = uuid
    // act
    const result = parseIntegrationRef(ref)
    // assert
    const expected: IntegrationRef = { type: 'id', id: ref }
    expect(result).toEqual(expected)
  })

  test('parse with a name and version should return name and version', () => {
    // arrange
    const version = '1.0.0'
    const ref = `${name}@${version}`
    // act
    const result = parseIntegrationRef(ref)
    // assert
    const expected: IntegrationRef = { type: 'name', name, version }
    expect(result).toEqual(expected)
  })

  test('parse with a name and latest should return name and latest', () => {
    // arrange
    const version = 'latest'
    const ref = `${name}@${version}`
    // act
    const result = parseIntegrationRef(ref)
    // assert
    const expected: IntegrationRef = { type: 'name', name, version }
    expect(result).toEqual(expected)
  })

  test('parse with only a name should return name and latest', () => {
    // arrange
    const ref = name
    // act
    const result = parseIntegrationRef(ref)
    // assert
    const expected: IntegrationRef = { type: 'name', name, version: 'latest' }
    expect(result).toEqual(expected)
  })
})

describe('formatIntegrationRef', () => {
  test('format with a path should return path', () => {
    // arrange
    const ref: IntegrationRef = { type: 'path', path }
    // act
    const result = formatIntegrationRef(ref)
    // assert
    expect(result).toEqual(ref.path)
  })

  test('format with a prefixed ULID uses `id` type', () => {
    // arrange
    const ref: IntegrationRef = { type: 'id', id: prefixedUlid }
    // act
    const result = formatIntegrationRef(ref)
    // assert
    expect(result).toEqual(ref.id)
  })

  test('format with a legacy UUID uses `id` type', () => {
    // arrange
    const ref: IntegrationRef = { type: 'id', id: uuid }
    // act
    const result = formatIntegrationRef(ref)
    // assert
    expect(result).toEqual(ref.id)
  })

  test('format with a name and version should return name and version', () => {
    // arrange
    const version = '1.0.0'
    const ref: IntegrationRef = { type: 'name', name, version }
    // act
    const result = formatIntegrationRef(ref)
    // assert
    expect(result).toEqual(`${name}@${version}`)
  })
})
