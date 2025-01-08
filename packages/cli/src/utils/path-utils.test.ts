import { test, expect, describe } from 'vitest'
import * as pathUtils from './path-utils'

describe('posix', () => {
  test('isPath with valid relative path should return true', () => {
    expect(pathUtils.posix.isPath('./src')).toBe(true)
    expect(pathUtils.posix.isPath('../src')).toBe(true)
    expect(pathUtils.posix.isPath('./src/services')).toBe(true)
    expect(pathUtils.posix.isPath('./src/services/index.ts')).toBe(true)
    expect(pathUtils.posix.isPath('./.././.././../lol.json')).toBe(true)
  })

  test('isPath with valid absolute path should return true', () => {
    expect(pathUtils.posix.isPath('/src')).toBe(true)
    expect(pathUtils.posix.isPath('/src')).toBe(true)
    expect(pathUtils.posix.isPath('/src/services')).toBe(true)
    expect(pathUtils.posix.isPath('/src/services/index.ts')).toBe(true)
  })

  test('isPath with invalid path should return false', () => {
    // these are technically valid posix paths, but not for the bp cli
    expect(pathUtils.posix.isPath('src')).toBe(false)
    expect(pathUtils.posix.isPath('.src')).toBe(false)
    expect(pathUtils.posix.isPath('..src')).toBe(false)
    expect(pathUtils.posix.isPath('src/services')).toBe(false)
    expect(pathUtils.posix.isPath('src/services/index.ts')).toBe(false)
  })
})

describe('win32', () => {
  test('isPath with valid relative path should return true', () => {
    expect(pathUtils.win32.isPath('.\\src')).toBe(true)
    expect(pathUtils.win32.isPath('..\\src')).toBe(true)
    expect(pathUtils.win32.isPath('.\\src\\services')).toBe(true)
    expect(pathUtils.win32.isPath('.\\src\\services\\index.ts')).toBe(true)
    expect(pathUtils.win32.isPath('.\\..\\.\\..\\.\\..\\lol.json')).toBe(true)
  })

  test('isPath with valid absolute path should return true', () => {
    expect(pathUtils.win32.isPath('C:\\src')).toBe(true)
    expect(pathUtils.win32.isPath('C:\\src')).toBe(true)
    expect(pathUtils.win32.isPath('C:\\src\\services')).toBe(true)
    expect(pathUtils.win32.isPath('C:\\src\\services\\index.ts')).toBe(true)
  })

  test('isPath with invalid path should return false', () => {
    // these are technically valid win32 paths, but not for the bp cli
    expect(pathUtils.win32.isPath('src')).toBe(false)
    expect(pathUtils.win32.isPath('.src')).toBe(false)
    expect(pathUtils.win32.isPath('..src')).toBe(false)
    expect(pathUtils.win32.isPath('src\\services')).toBe(false)
    expect(pathUtils.win32.isPath('src\\services\\index.ts')).toBe(false)
    expect(pathUtils.win32.isPath('\\services')).toBe(false)
    expect(pathUtils.win32.isPath('\\services\\index.ts')).toBe(false)
  })
})
