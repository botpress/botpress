import { actionServerIdRegex } from './utils'

describe('actionServerIdRegex', () => {
  test('casing', () => {
    expect(actionServerIdRegex.test('servername')).toEqual(true)
    expect(actionServerIdRegex.test('SERVERNAME')).toEqual(true)
    expect(actionServerIdRegex.test('ServerName')).toEqual(true)
    expect(actionServerIdRegex.test('sErVeRnAmE')).toEqual(true)
  })

  test('numbers', () => {
    expect(actionServerIdRegex.test('servername1')).toEqual(true)
    expect(actionServerIdRegex.test('1servername')).toEqual(true)
    expect(actionServerIdRegex.test('server1name')).toEqual(true)
    expect(actionServerIdRegex.test('12345')).toEqual(true)
  })

  test('spaces', () => {
    expect(actionServerIdRegex.test(' servername')).toEqual(false)
    expect(actionServerIdRegex.test('servername ')).toEqual(false)
    expect(actionServerIdRegex.test('server name')).toEqual(false)
  })

  test('special characters', () => {
    expect(actionServerIdRegex.test('server+name')).toEqual(false)
    expect(actionServerIdRegex.test('server_name')).toEqual(false)
    expect(actionServerIdRegex.test('server-name')).toEqual(false)
    expect(actionServerIdRegex.test('server%name')).toEqual(false)
  })
})
